import { execFile } from "node:child_process";

export default async function globalTeardown() {
  await new Promise<void>((resolve) => {
    execFile("node", ["e2e/clerk-test-users.mjs"], (err, stdout, stderr) => {
      if (stdout) console.log(stdout.trimEnd());
      if (err) console.warn("Clerk test user cleanup failed:", stderr || err);
      resolve();
    });
  });
}
