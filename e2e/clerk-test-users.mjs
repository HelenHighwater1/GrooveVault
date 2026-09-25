// Deletes Clerk users created by the e2e suite — testEmail() in helpers.ts
// generates groovevault-<ms>-<runTag>-<rand>+clerk_test@example.com addresses.
// Without cleanup the dev instance hits its 100-user cap and sign-ups fail.
// Runs automatically via playwright globalTeardown; also runnable by hand:
//   npm run test:clean-users
//
// When E2E_RUN_ID is set (always under playwright, which defines it in
// playwright.config.ts), only this run's users — plus test users older than a
// day — are deleted, so a concurrent run's accounts are left alone. Running
// the script directly without E2E_RUN_ID sweeps all test users.
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const CLERK_API = "https://api.clerk.com/v1";
const RUN_TAG = (process.env.E2E_RUN_ID ?? "").replace(/[^a-z0-9]/gi, "");
const STALE_MS = 24 * 60 * 60 * 1000;

function isTestEmail(email) {
  return email.endsWith("+clerk_test@example.com");
}

function isStale(email) {
  const created = Number(email.match(/^groovevault-(\d+)-/)?.[1]);
  return Number.isFinite(created) && Date.now() - created > STALE_MS;
}

function shouldDelete(user) {
  const emails = (user.email_addresses ?? []).map((e) => e.email_address);
  if (emails.length === 0 || !emails.every(isTestEmail)) return false;
  if (!RUN_TAG) return true;
  return emails.some((e) => e.includes(`-${RUN_TAG}-`) || isStale(e));
}

async function deleteClerkTestUsers() {
  const key = process.env.CLERK_SECRET_KEY;
  if (!key) {
    console.warn("CLERK_SECRET_KEY not set — skipping Clerk test user cleanup");
    return;
  }
  const headers = { Authorization: `Bearer ${key}` };

  // Deleting shifts later pages left, so track an offset of only the users
  // we keep, and repeat until a page comes back empty.
  let kept = 0;
  let deleted = 0;
  const failed = [];
  for (let i = 0; i < 50; i++) {
    const res = await fetch(`${CLERK_API}/users?limit=100&offset=${kept}`, {
      headers,
    });
    if (!res.ok) throw new Error(`Clerk list users failed: ${res.status}`);
    const users = await res.json();
    if (users.length === 0) break;
    for (const user of users) {
      if (!shouldDelete(user)) {
        kept++;
        continue;
      }
      const del = await fetch(`${CLERK_API}/users/${user.id}`, {
        method: "DELETE",
        headers,
      });
      // Count failures as kept so pagination moves past them, but report
      // them so the operator knows cleanup was incomplete.
      if (del.ok) deleted++;
      else {
        kept++;
        failed.push(`${user.id} (${del.status})`);
      }
    }
  }
  console.log(`Deleted ${deleted} Clerk test user(s)`);
  if (failed.length > 0) {
    console.error(`Failed to delete ${failed.length}: ${failed.join(", ")}`);
    process.exitCode = 1;
  }
}

deleteClerkTestUsers().catch((err) => {
  console.error(err);
  process.exit(1);
});
