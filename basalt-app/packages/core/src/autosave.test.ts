import { describe, expect, it } from "vitest";
import { createAutosave, type AutosaveStatus } from "./autosave";
import type { SaveMode } from "./notes";
import { err, ok, type AppError, type Result } from "./result";

const DELAY = 1000;

function createFakeScheduler() {
    let now = 0;
    let nextId = 0;
    const timers = new Map<number, { at: number; run: () => void }>();
    return {
        schedule(run: () => void, delayMs: number) {
            const id = nextId++;
            timers.set(id, { at: now + delayMs, run });
            return () => {
                timers.delete(id);
            };
        },
        pending: () => timers.size,
        advance(ms: number) {
            now += ms;
            for (const [id, timer] of [...timers]) {
                if (timer.at <= now && timers.delete(id)) timer.run();
            }
        },
    };
}

function createFakeSave() {
    const calls: string[] = [];
    const modes: SaveMode[] = [];
    const waiting: Array<(result: Result<void>) => void> = [];
    return {
        calls,
        modes,
        save(text: string, mode: SaveMode) {
            calls.push(text);
            modes.push(mode);
            return new Promise<Result<void>>((resolve) => {
                waiting.push(resolve);
            });
        },
        settle(result: Result<void> = ok(undefined)) {
            const resolve = waiting.shift();
            if (!resolve) throw new Error("no save in flight");
            resolve(result);
        },
        inFlight: () => waiting.length,
    };
}

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

const conflict: AppError = { code: "conflict", message: "changed on disk" };

function setup(baseText = "base") {
    const scheduler = createFakeScheduler();
    const saver = createFakeSave();
    const autosave = createAutosave({
        baseText,
        save: saver.save,
        schedule: scheduler.schedule,
        delayMs: DELAY,
    });
    const statuses: AutosaveStatus[] = [];
    autosave.onStatus((status) => statuses.push(status));
    return { scheduler, saver, autosave, statuses };
}

describe("createAutosave", () => {
    it("never writes while clean", async () => {
        const { scheduler, saver, autosave, statuses } = setup();
        scheduler.advance(10 * DELAY);
        expect((await autosave.flush()).ok).toBe(true);
        autosave.change("base");
        scheduler.advance(10 * DELAY);
        expect(saver.calls).toEqual([]);
        expect(autosave.getStatus()).toBe("saved");
        expect(statuses).toEqual([]);
    });

    it("returns to saved without writing when text is reverted to the baseline", () => {
        const { scheduler, saver, autosave } = setup();
        autosave.change("edited");
        autosave.change("base");
        expect(autosave.getStatus()).toBe("saved");
        expect(scheduler.pending()).toBe(0);
        scheduler.advance(DELAY);
        expect(saver.calls).toEqual([]);
    });

    it("debounces and restarts the delay on every change", () => {
        const { scheduler, saver, autosave } = setup();
        autosave.change("a");
        scheduler.advance(DELAY - 1);
        autosave.change("ab");
        scheduler.advance(DELAY - 1);
        expect(saver.calls).toEqual([]);
        scheduler.advance(1);
        expect(saver.calls).toEqual(["ab"]);
    });

    it("flush writes immediately and cancels the timer", async () => {
        const { scheduler, saver, autosave } = setup();
        autosave.change("edited");
        const flushed = autosave.flush();
        expect(saver.calls).toEqual(["edited"]);
        expect(scheduler.pending()).toBe(0);
        saver.settle();
        expect((await flushed).ok).toBe(true);
        scheduler.advance(10 * DELAY);
        expect(saver.calls).toEqual(["edited"]);
        expect(autosave.getStatus()).toBe("saved");
    });

    it("flush after a save does nothing when clean", async () => {
        const { saver, autosave } = setup();
        autosave.change("edited");
        const first = autosave.flush();
        saver.settle();
        await first;
        expect((await autosave.flush()).ok).toBe(true);
        expect(saver.calls).toEqual(["edited"]);
    });

    it("keeps one save in flight and runs one follow-up with the latest text", async () => {
        const { scheduler, saver, autosave } = setup();
        autosave.change("a");
        scheduler.advance(DELAY);
        expect(saver.calls).toEqual(["a"]);

        autosave.change("ab");
        autosave.change("abc");
        scheduler.advance(10 * DELAY);
        expect(saver.calls).toEqual(["a"]);
        expect(saver.inFlight()).toBe(1);

        saver.settle();
        await tick();
        expect(saver.calls).toEqual(["a", "abc"]);
        expect(saver.inFlight()).toBe(1);
        saver.settle();
        await tick();
        scheduler.advance(10 * DELAY);
        expect(saver.calls).toEqual(["a", "abc"]);
        expect(autosave.getStatus()).toBe("saved");
    });

    it("flush during a save waits for it and then writes the latest text once", async () => {
        const { saver, autosave } = setup();
        autosave.change("a");
        const first = autosave.flush();
        autosave.change("ab");
        const second = autosave.flush();
        expect(saver.calls).toEqual(["a"]);
        saver.settle();
        await tick();
        expect(saver.calls).toEqual(["a", "ab"]);
        saver.settle();
        expect((await first).ok).toBe(true);
        expect((await second).ok).toBe(true);
        expect(saver.calls).toEqual(["a", "ab"]);
    });

    it("pauses on error, keeps the text and stops automatic saves", async () => {
        const { scheduler, saver, autosave } = setup();
        autosave.change("edited");
        scheduler.advance(DELAY);
        saver.settle(err(conflict));
        await tick();
        expect(autosave.getStatus()).toBe("paused");
        expect(autosave.getError()).toEqual(conflict);

        autosave.change("edited more");
        scheduler.advance(10 * DELAY);
        expect(saver.calls).toEqual(["edited"]);
        expect(autosave.getStatus()).toBe("paused");

        const flushed = await autosave.flush();
        expect(flushed).toEqual(err(conflict));
        expect(saver.calls).toEqual(["edited"]);
    });

    it("pauses when a flush fails and reports the error", async () => {
        const { saver, autosave } = setup();
        autosave.change("edited");
        const flushed = autosave.flush();
        saver.settle(err({ code: "not-found", message: "gone" }));
        expect(await flushed).toEqual(
            err({ code: "not-found", message: "gone" }),
        );
        expect(autosave.getStatus()).toBe("paused");
    });

    it("resume saves the pending text after the owner resolves the error", async () => {
        const { saver, autosave } = setup();
        autosave.change("edited");
        const failed = autosave.flush();
        saver.settle(err(conflict));
        await failed;
        autosave.change("edited again");

        const resumed = autosave.resume();
        expect(autosave.getError()).toBeNull();
        expect(saver.calls).toEqual(["edited", "edited again"]);
        saver.settle();
        expect((await resumed).ok).toBe(true);
        expect(autosave.getStatus()).toBe("saved");
    });

    it("stays paused when the retry after resume fails again", async () => {
        const { saver, autosave } = setup();
        autosave.change("edited");
        const failed = autosave.flush();
        saver.settle(err(conflict));
        await failed;

        const resumed = autosave.resume();
        saver.settle(err(conflict));
        expect(await resumed).toEqual(err(conflict));
        expect(autosave.getStatus()).toBe("paused");
    });

    it("reports saved, pending, saving, paused in order", async () => {
        const { saver, scheduler, autosave, statuses } = setup();
        expect(autosave.getStatus()).toBe("saved");
        autosave.change("a");
        scheduler.advance(DELAY);
        saver.settle();
        await tick();
        autosave.change("b");
        scheduler.advance(DELAY);
        saver.settle(err(conflict));
        await tick();
        expect(statuses).toEqual([
            "pending",
            "saving",
            "saved",
            "pending",
            "saving",
            "paused",
        ]);
    });

    it("stops notifying unsubscribed listeners and ignores changes after dispose", () => {
        const { scheduler, saver, autosave } = setup();
        const seen: AutosaveStatus[] = [];
        const unsubscribe = autosave.onStatus((status) => seen.push(status));
        unsubscribe();
        autosave.change("a");
        expect(seen).toEqual([]);
        autosave.dispose();
        expect(scheduler.pending()).toBe(0);
        autosave.change("b");
        scheduler.advance(10 * DELAY);
        expect(saver.calls).toEqual([]);
    });

    it("rebase adopts the disk text as the clean baseline and cancels the pending save", async () => {
        const { scheduler, saver, autosave } = setup();
        autosave.change("local edit");
        autosave.rebase("from disk");
        expect(autosave.getStatus()).toBe("saved");
        expect(scheduler.pending()).toBe(0);
        scheduler.advance(10 * DELAY);
        expect((await autosave.flush()).ok).toBe(true);
        expect(saver.calls).toEqual([]);
        autosave.change("from disk");
        expect(autosave.getStatus()).toBe("saved");
        autosave.change("next");
        expect(autosave.getStatus()).toBe("pending");
    });

    it("rebase clears a paused error so saving works again", async () => {
        const { scheduler, saver, autosave } = setup();
        autosave.change("a");
        scheduler.advance(DELAY);
        await tick();
        saver.settle(err(conflict));
        await tick();
        expect(autosave.getStatus()).toBe("paused");
        autosave.rebase("disk");
        expect(autosave.getStatus()).toBe("saved");
        expect(autosave.getError()).toBeNull();
        autosave.change("b");
        scheduler.advance(DELAY);
        await tick();
        expect(saver.calls).toEqual(["a", "b"]);
    });

    it("rebase during a save ignores the stale save result", async () => {
        const { scheduler, saver, autosave } = setup();
        autosave.change("a");
        scheduler.advance(DELAY);
        await tick();
        autosave.rebase("disk");
        saver.settle(err(conflict));
        await tick();
        expect(autosave.getStatus()).toBe("saved");
        expect(autosave.getError()).toBeNull();
        autosave.change("disk");
        expect(autosave.getStatus()).toBe("saved");
        expect((await autosave.flush()).ok).toBe(true);
        expect(saver.calls).toEqual(["a"]);
    });
    it("pause stops automatic saves, keeps the text and reports the error from flush", async () => {
        const { scheduler, saver, autosave } = setup();
        autosave.change("edited");
        autosave.pause(conflict);

        expect(autosave.getStatus()).toBe("paused");
        expect(autosave.getError()).toEqual(conflict);
        expect(scheduler.pending()).toBe(0);
        autosave.change("edited more");
        scheduler.advance(10 * DELAY);
        expect(saver.calls).toEqual([]);
        expect(await autosave.flush()).toEqual(err(conflict));
    });

    it("pause keeps the paused status when an in-flight save finishes afterwards", async () => {
        const { scheduler, saver, autosave } = setup();
        autosave.change("a");
        scheduler.advance(DELAY);
        await tick();
        autosave.pause(conflict);
        saver.settle();
        await tick();

        expect(autosave.getStatus()).toBe("paused");
        expect(autosave.getError()).toEqual(conflict);
    });

    it("forceSave writes the text even when it equals the baseline and clears the pause", async () => {
        const { saver, autosave } = setup();
        autosave.pause({ code: "not-found", message: "gone" });

        const forced = autosave.forceSave();
        expect(saver.calls).toEqual(["base"]);
        saver.settle();

        expect((await forced).ok).toBe(true);
        expect(autosave.getStatus()).toBe("saved");
        expect(autosave.getError()).toBeNull();
    });

    it("forceSave stays paused and reports the error when the write fails", async () => {
        const { saver, autosave } = setup();
        autosave.pause(conflict);

        const forced = autosave.forceSave();
        saver.settle(err({ code: "permission-denied", message: "ro" }));

        expect(await forced).toEqual(
            err({ code: "permission-denied", message: "ro" }),
        );
        expect(autosave.getStatus()).toBe("paused");
    });

    it("forceSave does not write a clean note that has no error", async () => {
        const { saver, autosave } = setup();

        expect((await autosave.forceSave()).ok).toBe(true);
        expect((await autosave.forceSave("overwrite")).ok).toBe(true);

        expect(saver.calls).toEqual([]);
        expect(autosave.getStatus()).toBe("saved");
    });

    it("forceSave does not write after the text was reverted to the baseline", async () => {
        const { saver, autosave } = setup();
        autosave.change("edited");
        autosave.change("base");

        await autosave.forceSave();

        expect(saver.calls).toEqual([]);
    });

    it("forceSave writes a dirty note without an error", async () => {
        const { saver, autosave } = setup();
        autosave.change("edited");

        const forced = autosave.forceSave();
        expect(saver.calls).toEqual(["edited"]);
        saver.settle();

        expect((await forced).ok).toBe(true);
        expect(autosave.getStatus()).toBe("saved");
    });

    it("forceSave passes its mode only to its own save, not to a queued flush save", async () => {
        const { scheduler, saver, autosave } = setup();
        autosave.change("a");
        scheduler.advance(DELAY);
        expect(saver.modes).toEqual(["normal"]);
        autosave.change("ab");
        const flushed = autosave.flush();
        const forced = autosave.forceSave("overwrite");

        saver.settle();
        await tick();
        expect(saver.modes).toEqual(["normal", "normal"]);
        saver.settle(err(conflict));
        await tick();
        expect(saver.modes).toEqual(["normal", "normal", "overwrite"]);
        saver.settle();

        expect(await flushed).toEqual(err(conflict));
        expect((await forced).ok).toBe(true);
        expect(autosave.getStatus()).toBe("saved");
        expect(autosave.getError()).toBeNull();
    });

    it("forceSave with a mode saves a paused note in that mode", async () => {
        const { saver, autosave } = setup();
        autosave.change("mine");
        autosave.pause(conflict);

        const forced = autosave.forceSave("overwrite");
        saver.settle();

        expect((await forced).ok).toBe(true);
        expect(saver.modes).toEqual(["overwrite"]);
    });
});
