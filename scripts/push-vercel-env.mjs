import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env");
const raw = fs.readFileSync(envPath, "utf8");
const parsed = {};
for (const line of raw.split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (!m) continue;
  parsed[m[1]] = m[2].replace(/^"|"$/g, "");
}

const demoSecret = "a8f3c2e1-4b5d-6e7f-8a9b-0c1d2e3f4a5b";
const appUrl = "https://relay-ai-app.vercel.app";
const demoWidgetKey = "wk_test_e2e_demo_widget_key";

const vars = {
  DATABASE_URL: parsed.DATABASE_URL,
  OPENROUTER_API_KEY: parsed.OPENROUTER_API_KEY,
  OPENROUTER_CHAT_MODEL: parsed.OPENROUTER_CHAT_MODEL || "openrouter/free",
  APP_URL: appUrl,
  PUBLIC_DEMO_MODE: "true",
  NEXT_PUBLIC_PUBLIC_DEMO_MODE: "true",
  AUTH_BYPASS: "true",
  NEXT_PUBLIC_AUTH_BYPASS: "true",
  DEMO_SEED_SECRET: demoSecret,
  DEMO_ORGANIZATION_SLUG: "demo-company",
  DEMO_USER_EMAIL: "admin@demo.com",
  DEMO_WIDGET_KEY: demoWidgetKey,
  NEXT_PUBLIC_DEMO_RELAY_AI_URL: appUrl,
};

for (const [key, value] of Object.entries(vars)) {
  if (!value) {
    console.error(`Missing value for ${key}`);
    process.exit(1);
  }
  console.log(`Setting ${key}...`);
  execSync(
    `npx vercel env add ${key} production --value ${JSON.stringify(value)} --yes --force`,
    { stdio: "inherit", shell: true, cwd: root },
  );
}

console.log("Done. Run: npx vercel --prod --yes");
