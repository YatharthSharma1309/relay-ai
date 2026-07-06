import { execSync } from "node:child_process";

const defaultWidgetKey = "wk_test_e2e_demo_widget_key";

export default async function globalSetup() {
  if (process.env.CI) return;
  if (!process.env.DATABASE_URL) return;

  const widgetKey = process.env.DEMO_WIDGET_KEY ?? defaultWidgetKey;

  execSync("npm run db:seed", {
    stdio: "inherit",
    env: {
      ...process.env,
      DEMO_WIDGET_KEY: widgetKey,
    },
  });
}
