import "server-only";
import { clerkClient } from "@clerk/nextjs/server";

type ClerkClient = Awaited<ReturnType<typeof clerkClient>>;

// Display name for another vault member: full name, then primary email,
// then username. Deleted Clerk users degrade to "Former member".
export async function memberLabel(
  clerk: ClerkClient,
  userId: string,
): Promise<string> {
  try {
    const u = await clerk.users.getUser(userId);
    const name = [u.firstName, u.lastName].filter(Boolean).join(" ");
    const email = u.emailAddresses.find(
      (e) => e.id === u.primaryEmailAddressId,
    )?.emailAddress;
    return name || email || u.username || "Vault member";
  } catch {
    return "Former member";
  }
}

export function selfLabel(user: {
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  primaryEmailAddress: { emailAddress: string } | null;
}): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return (
    name || user.primaryEmailAddress?.emailAddress || user.username || "you"
  );
}
