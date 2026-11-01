import { existsSync, lstatSync, symlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";

const target = fileURLToPath(
    new URL("../../../basalt-app/node_modules", import.meta.url),
);
const link = fileURLToPath(new URL("../node_modules", import.meta.url));

if (!existsSync(target)) {
    console.error(
        "basalt-app/node_modules is missing. Run `npm ci` in basalt-app/ first.",
    );
    process.exit(1);
}

let linked = false;
try {
    linked = lstatSync(link).isSymbolicLink() || existsSync(link);
} catch {
    linked = false;
}

if (!linked) symlinkSync(target, link, "junction");
