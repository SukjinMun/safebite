import { randomBytes } from "node:crypto";
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { parse } from "dotenv";

const envPath = new URL("../.env", import.meta.url);
const examplePath = new URL("../.env.example", import.meta.url);
const source = readFileSync(
  existsSync(envPath) ? envPath : examplePath,
  "utf8",
);
const current = parse(source).SESSION_SECRET;

if (current && current.length >= 32) {
  chmodSync(envPath, 0o600);
  console.log(
    "Kept the existing SESSION_SECRET. Database settings were preserved.",
  );
} else {
  const line = `SESSION_SECRET=${randomBytes(32).toString("hex")}`;
  const pattern = /^[ \t]*(?:export[ \t]+)?SESSION_SECRET[ \t]*=.*$/m;
  const updated = pattern.test(source)
    ? source.replace(pattern, line)
    : `${source.trimEnd()}\n${line}\n`;
  writeFileSync(envPath, updated, { mode: 0o600 });
  chmodSync(envPath, 0o600);
  console.log(
    "Configured SESSION_SECRET in backend/.env. Database settings were preserved.",
  );
}
