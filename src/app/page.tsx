import Link from "next/link";
import { Show, SignInButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 p-8 text-center dark:bg-black">
      <h1 className="text-4xl font-semibold tracking-tight">GrooveVault</h1>
      <p className="max-w-md text-black/60 dark:text-white/60">
        Track, organize, and rediscover your vinyl collection.
      </p>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button className="rounded-full bg-black px-5 py-2 text-sm text-white dark:bg-white dark:text-black">
            Sign in to get started
          </button>
        </SignInButton>
      </Show>
      <Show when="signed-in">
        <Link
          href="/collection"
          className="rounded-full bg-black px-5 py-2 text-sm text-white dark:bg-white dark:text-black"
        >
          Go to your collection
        </Link>
      </Show>
    </div>
  );
}
