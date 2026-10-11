import { execSync } from "node:child_process";
import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests of signing in, official scoring and leaderboards against
 * a local Supabase (`npx supabase start`):  npm run test:e2e:supabase
 *
 * The local stack's keys are read from `supabase status`; nothing is stored.
 */
const PORT = 3200;

function localSupabase() {
  const status = JSON.parse(execSync("npx supabase status -o json", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
  return {
    NEXT_PUBLIC_SUPABASE_URL: status.API_URL as string,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: (status.PUBLISHABLE_KEY ?? status.ANON_KEY) as string,
    SUPABASE_SECRET_KEY: (status.SECRET_KEY ?? status.SERVICE_ROLE_KEY) as string,
  };
}

const supabase = localSupabase();
// the tests themselves talk to Supabase too (to create a player)
Object.assign(process.env, supabase);

export default defineConfig({
  testDir: "tests/e2e-supabase",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
  webServer: {
    // its own build folder, so it never mixes with the build of the plain e2e tests
    command: `npm run build && npm run start -- -p ${PORT}`,
    env: { ...supabase, NEXT_DIST_DIR: ".next-supabase" },
    url: `http://localhost:${PORT}/ar`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
