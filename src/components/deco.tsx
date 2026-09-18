import Link from "next/link";
import type { ReactNode } from "react";

export function Panel({
  alt = false,
  className = "",
  children,
}: {
  alt?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`panel-deco ${alt ? "panel-deco--alt" : ""} p-[clamp(22px,3vw,44px)] ${className}`}
    >
      {children}
    </section>
  );
}

export function Eyebrow({
  pulse = false,
  children,
}: {
  pulse?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      {pulse ? (
        <span className="deco-diamond deco-diamond--pulse" aria-hidden />
      ) : (
        <span className="eyebrow-rule" aria-hidden />
      )}
      <span className="eyebrow">{children}</span>
    </div>
  );
}

export function DecoDivider() {
  return (
    <div className="divider-deco" aria-hidden>
      <span className="deco-diamond" />
    </div>
  );
}

export function VinylDisc({
  className = "",
  speed = 7,
}: {
  className?: string;
  speed?: number;
}) {
  return (
    <span
      className={`vinyl animate-vinyl relative block aspect-square rounded-full ${className}`}
      style={{ animationDuration: `${speed}s` }}
      aria-hidden
    >
      <span className="vinyl-label absolute left-1/2 top-1/2 aspect-square w-[30%] -translate-x-1/2 -translate-y-1/2 rounded-full" />
    </span>
  );
}

function BrowseIcon() {
  return (
    <svg
      viewBox="0 0 32 32"
      className="h-8 w-8"
      fill="none"
      stroke="#d4a441"
      strokeWidth="2"
      aria-hidden
    >
      <line x1="5" y1="8" x2="5" y2="24" />
      <line x1="10.5" y1="4" x2="10.5" y2="28" />
      <line x1="16" y1="2" x2="16" y2="30" />
      <line x1="21.5" y1="4" x2="21.5" y2="28" />
      <line x1="27" y1="8" x2="27" y2="24" />
    </svg>
  );
}

function CratesIcon() {
  return (
    <svg
      viewBox="0 0 32 32"
      className="h-8 w-8"
      fill="none"
      stroke="#d4a441"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M5 29 V15 a11 11 0 0 1 22 0 V29" />
      <line x1="12.5" y1="17" x2="12.5" y2="29" />
      <line x1="19.5" y1="17" x2="19.5" y2="29" />
      <line x1="16" y1="11" x2="16" y2="29" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 32 32"
      className="h-8 w-8"
      fill="none"
      stroke="#f0d18a"
      strokeWidth="1.5"
      aria-hidden
    >
      <rect
        x="9.5"
        y="9.5"
        width="13"
        height="13"
        transform="rotate(45 16 16)"
      />
      <line x1="16" y1="11.5" x2="16" y2="20.5" />
      <line x1="11.5" y1="16" x2="20.5" y2="16" />
    </svg>
  );
}

function StatsIcon() {
  return (
    <span
      aria-hidden
      className="block h-7 w-7 rounded-full border border-gold/50"
      style={{
        background:
          "conic-gradient(#f0d18a 0 130deg, #d4a441 130deg 250deg, rgba(212,164,65,.35) 250deg 360deg)",
      }}
    />
  );
}

export function ArchCard({
  href,
  title,
  caption,
  icon,
  emphasized = false,
  soon = false,
}: {
  href?: string;
  title: string;
  caption: string;
  icon: "browse" | "crates" | "plus" | "stats";
  emphasized?: boolean;
  soon?: boolean;
}) {
  const icons = {
    browse: <BrowseIcon />,
    crates: <CratesIcon />,
    plus: <PlusIcon />,
    stats: <StatsIcon />,
  };

  const inner = (
    <>
      {icons[icon]}
      <span className="flex flex-col items-center gap-2">
        <span
          className={`font-display text-[23px] tracking-[.06em] ${
            emphasized ? "text-cream-bright" : "text-cream"
          }`}
        >
          {title}
        </span>
        <span
          className={`font-body text-[8.5px] uppercase tracking-[.28em] ${
            emphasized ? "text-gold-light/80" : "text-cream/45"
          }`}
        >
          {caption}
        </span>
      </span>
      {soon && <span className="gold-chip">Soon</span>}
    </>
  );

  const cls = `card-arch ${emphasized ? "card-arch--gold" : ""} ${soon ? "card-arch--soon" : ""}`;

  if (href && !soon) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <div className={cls} aria-disabled={soon}>
      {inner}
    </div>
  );
}
