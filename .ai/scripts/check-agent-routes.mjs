import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SKIP = new Set([
  ".git",
  "node_modules",
  "target",
  "dist",
  ".agents",
  ".claude",
]);
const ROOT_BUDGET = 150;
const UNIT_BUDGET = 120;

function findAgentFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP.has(entry.name))
        found.push(...findAgentFiles(join(dir, entry.name)));
    } else if (entry.name === "AGENTS.md") {
      found.push(join(dir, entry.name));
    }
  }
  return found;
}

function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function headings(path) {
  return readFileSync(path, "utf8")
    .split("\n")
    .filter((line) => /^#{1,6} /.test(line))
    .map((line) => line.replace(/^#+ /, "").trim());
}

function routeCells(text) {
  const cells = [];
  let inTable = false;
  for (const line of text.split("\n")) {
    const cols = line.trim().startsWith("|")
      ? line
          .trim()
          .replace(/^\||\|$/g, "")
          .split("|")
          .map((c) => c.trim())
      : null;
    if (!cols) {
      inTable = false;
      continue;
    }
    if (cols[0] === "Task" && cols[1] === "Read") {
      inTable = true;
      continue;
    }
    if (inTable && !/^-+$/.test(cols[0])) cells.push(cols[1] ?? "");
  }
  return cells;
}

function checkRoutes(agentFile) {
  const errors = [];
  const cells = routeCells(readFileSync(agentFile, "utf8"));
  for (const cell of cells) {
    for (const item of cell
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean)) {
      const match = item.match(/^`([^`]+)`(.*)$/);
      if (!match) {
        errors.push(
          `route item does not start with a backticked path: "${item}"`,
        );
        continue;
      }
      const [, target, rest] = match;
      const full = join(root, target);
      if (!isFile(full)) {
        errors.push(`routed path is not an existing file: ${target}`);
        continue;
      }
      const sections = rest
        .split("§")
        .slice(1)
        .map((s) => s.trim().replace(/,$/, "").trim());
      const known = headings(full);
      for (const section of sections) {
        if (!known.includes(section))
          errors.push(`section "${section}" not found in ${target}`);
      }
    }
  }
  return { errors, routes: cells.length };
}

const files = findAgentFiles(root);
let failed = false;
for (const file of files) {
  const rel = relative(root, file);
  const isRoot = rel === "AGENTS.md";
  const lines = readFileSync(file, "utf8").split("\n").length - 1;
  const budget = isRoot ? ROOT_BUDGET : UNIT_BUDGET;
  const problems = [];
  if (lines > budget)
    problems.push(`${lines} lines exceeds budget of ${budget}`);
  const { errors, routes } = checkRoutes(file);
  problems.push(...errors);
  if (isRoot && routes === 0)
    problems.push("root AGENTS.md has no | Task | Read | routing table");
  if (!isFile(join(dirname(file), "CLAUDE.md")))
    problems.push("missing sibling CLAUDE.md");
  if (problems.length) {
    failed = true;
    for (const p of problems) console.error(`FAIL ${rel}: ${p}`);
  } else {
    console.log(`ok   ${rel} (${lines} lines, ${routes} routes)`);
  }
}
process.exit(failed ? 1 : 0);
