#!/usr/bin/env node
/**
 * Environment runner.
 *
 *   node scripts/env.mjs <local|staging|production> <command> [...args]
 *
 * 1. Loads `.env.<name>` (local -> `.env.local`); on servers also falls back to `.env`.
 * 2. Blanks every key from `.env.example` that the env file did not set, so Next.js
 *    can't silently pull values from another environment's file.
 * 3. Sets APP_ENV / NEXT_PUBLIC_APP_ENV.
 * 4. Refuses destructive database commands against production.
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ENVS = ["local", "staging", "production"];
const root = process.cwd();
const [name, ...command] = process.argv.slice(2);

if (!ENVS.includes(name) || command.length === 0) {
    console.error(`Usage: node scripts/env.mjs <${ENVS.join("|")}> <command> [...args]`);
    process.exit(1);
}

// Values already exported in the shell win over files (same rule as Next.js).
const files = name === "local" ? [".env.local"] : [`.env.${name}`, ".env"];
const loaded = files.filter((f) => existsSync(path.join(root, f)));
for (const f of loaded) process.loadEnvFile(path.join(root, f));

if (name === "local" && loaded.length === 0) {
    console.error("✖ .env.local not found. Create it with:  cp .env.example .env.local");
    process.exit(1);
}

const exampleKeys = readFileSync(path.join(root, ".env.example"), "utf8")
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=/)?.[1])
    .filter(Boolean);
for (const key of exampleKeys) {
    if (process.env[key] === undefined) process.env[key] = "";
}

process.env.APP_ENV = name;
process.env.NEXT_PUBLIC_APP_ENV = name;

// --- Safety guards ---------------------------------------------------------
const cmdline = command.join(" ");
const dbHost = (() => {
    try {
        return new URL(process.env.DATABASE_URL).hostname;
    } catch {
        return "";
    }
})();

if (name === "production") {
    const forbidden = [/migrate\s+dev/, /migrate\s+reset/, /db\s+push/, /db\s+seed/, /prisma\/seed/];
    if (forbidden.some((re) => re.test(cmdline))) {
        console.error(`✖ Refusing to run "${cmdline}" against PRODUCTION.`);
        console.error("  Production schema changes go through committed migrations: npm run db:deploy:production");
        process.exit(1);
    }
}

if (name === "local" && dbHost && !["localhost", "127.0.0.1", "::1", "postgres"].includes(dbHost)) {
    console.warn(`⚠ APP_ENV=local but DATABASE_URL points at "${dbHost}". Local work should use the docker database.`);
}

const source = loaded.length ? loaded.join(", ") : "process environment only";
console.log(`▶ [${name.toUpperCase()}] ${cmdline}   (env: ${source}${dbHost ? `, db: ${dbHost}` : ""})`);

// One quoted command string: needed for .cmd shims on Windows, and avoids Node's DEP0190 warning.
const quoted = command.map((arg) => (/[\s"]/.test(arg) ? `"${arg.replace(/"/g, '\\"')}"` : arg)).join(" ");
const child = spawn(quoted, { stdio: "inherit", shell: true, env: process.env });
child.on("exit", (code, signal) => process.exit(signal ? 1 : code ?? 0));
