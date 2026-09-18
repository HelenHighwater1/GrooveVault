import type { Metadata } from "next";
import Link from "next/link";
import { Poiret_One, Jost, Cormorant_Garamond } from "next/font/google";
import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import "./globals.css";

const poiret = Poiret_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-poiret",
});

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

export const metadata: Metadata = {
  title: "GrooveVault",
  description: "Track, organize, and rediscover your vinyl collection.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${poiret.variable} ${jost.variable} ${cormorant.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ClerkProvider>
          <header className="relative z-10 flex items-center justify-between px-[clamp(16px,2.4vw,34px)] py-5">
            <Link href="/" className="flex items-center gap-3">
              <span className="logo-mark" aria-hidden />
              <span className="flex flex-col gap-1.5">
                <span className="font-display text-[19px] uppercase leading-none tracking-[.34em] text-gold-light">
                  Groove Vault
                </span>
                <span className="font-body text-[8.5px] font-light uppercase tracking-[.42em] text-cream/40">
                  Est. 1998 · Side A
                </span>
              </span>
            </Link>
            <nav className="flex items-center gap-3">
              <Show when="signed-in">
                <Link
                  href="/collection"
                  className="font-body text-[10px] font-medium uppercase tracking-[.3em] text-gold-light hover:text-gold-pale"
                >
                  Collection
                </Link>
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: {
                        width: "38px",
                        height: "38px",
                        borderRadius: "0",
                        border: "1px solid rgba(212,164,65,.5)",
                      },
                    },
                  }}
                />
              </Show>
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="btn-ghost px-4 py-2.5">Sign in</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="btn-gold px-4 py-2.5">
                    Create account
                  </button>
                </SignUpButton>
              </Show>
            </nav>
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
