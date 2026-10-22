import Link from "next/link";
import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  getInviteByToken,
  getMembership,
  listMergeableVaultIds,
} from "@/lib/collections";
import { memberLabel } from "@/lib/labels";
import { countRecordsIn } from "@/lib/records";
import { Eyebrow, Panel } from "@/components/deco";
import { AcceptInvite } from "./accept-invite";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const invite = await getInviteByToken(token);

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <Panel className="flex w-full max-w-lg flex-col items-center gap-6 text-center">
        <Eyebrow>An invitation</Eyebrow>
        {!invite ? (
          <>
            <h1 className="font-display text-[clamp(28px,4vw,40px)] leading-[1] tracking-[.02em] text-cream">
              This link is dead
            </h1>
            <p className="font-accent text-[16px] italic leading-[1.6] text-cream/60">
              It expired or was revoked — ask for a fresh one.
            </p>
            <Link href="/collection" className="btn-ghost">
              Head home
            </Link>
          </>
        ) : (
          <InviteReady userId={user.id} invite={invite} />
        )}
      </Panel>
    </main>
  );
}

async function InviteReady({
  userId,
  invite,
}: {
  userId: string;
  invite: NonNullable<Awaited<ReturnType<typeof getInviteByToken>>>;
}) {
  const clerk = await clerkClient();
  const [alreadyMember, inviterName, mergeableIds] = await Promise.all([
    getMembership(userId, invite.collectionId),
    memberLabel(clerk, invite.inviterId),
    listMergeableVaultIds(userId, invite.collectionId),
  ]);
  const mergeableCount = alreadyMember ? 0 : await countRecordsIn(mergeableIds);

  return (
    <>
      <h1 className="font-display text-[clamp(28px,4vw,40px)] leading-[1] tracking-[.02em] text-cream">
        Join {invite.collectionName}?
      </h1>
      <p className="font-accent text-[16px] italic leading-[1.6] text-cream/60">
        {inviterName} invited you — everyone in the vault can scan and edit the
        same records.
      </p>
      <AcceptInvite
        token={invite.token}
        alreadyMember={Boolean(alreadyMember)}
        mergeableCount={mergeableCount}
      />
    </>
  );
}
