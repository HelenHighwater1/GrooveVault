import { deleteClerkTestUsers } from "./clerk-test-users.js";

export default async function globalTeardown() {
  try {
    await deleteClerkTestUsers();
  } catch (err) {
    console.warn("Clerk test user cleanup failed:", err);
  }
}
