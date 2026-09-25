// Deletes Clerk users created by the e2e suite — testEmail() in helpers.ts
// generates *+clerk_test@example.com addresses. Without cleanup the dev
// instance hits its 100-user cap and sign-ups fail. Runs automatically via
// playwright globalTeardown; also runnable by hand:
//   npm run test:clean-users
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });

const CLERK_API = "https://api.clerk.com/v1";

function isTestUser(user) {
  const emails = (user.email_addresses ?? []).map((e) => e.email_address);
  return (
    emails.length > 0 &&
    emails.every((e) => e.endsWith("+clerk_test@example.com"))
  );
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
  for (let i = 0; i < 50; i++) {
    const res = await fetch(`${CLERK_API}/users?limit=100&offset=${kept}`, {
      headers,
    });
    if (!res.ok) throw new Error(`Clerk list users failed: ${res.status}`);
    const users = await res.json();
    if (users.length === 0) break;
    for (const user of users) {
      if (!isTestUser(user)) {
        kept++;
        continue;
      }
      const del = await fetch(`${CLERK_API}/users/${user.id}`, {
        method: "DELETE",
        headers,
      });
      // On a failed delete, count the user as kept so pagination moves past it.
      if (del.ok) deleted++;
      else kept++;
    }
  }
  console.log(`Deleted ${deleted} Clerk test user(s)`);
}

module.exports = { deleteClerkTestUsers };

if (require.main === module) {
  deleteClerkTestUsers().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
