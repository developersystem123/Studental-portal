"use client";

/**
 * MediaCard — the single, reusable "image-topped card" used across EduPortal.
 *
 * Every grid card with a picture (courses, learning paths, blog posts,
 * physical classes, wishlist items…) is built on this component, so the card
 * chrome — rounded corners, border, shadow, hover lift, image area, the dark
 * scrim and the broken-image fallback — is defined in exactly one place.
 * Change the look here once and it updates everywhere automatically.
 *
 * Each page still supplies its own body content via `children`; only the
 * shared visual shell lives here.
 */

import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/ui";
import Icon from "@/components/icons";
import { cn } from "@/lib/utils";

const ASPECT = {
  video: "aspect-video", // 16:9 — the default for course / path cards
  wide: "aspect-[2/1]", // short banner — e.g. physical class cards
  photo: "aspect-[3/2]", // a touch taller — editorial / blog cards
} as const;

export type MediaCardAspect = keyof typeof ASPECT;

// A small, fixed palette so a card that has no image (or whose image fails to
// load) still gets a pleasant, *stable* gradient instead of an empty grey box.
const FALLBACK_GRADIENTS = [
  "from-green-600 to-emerald-500",
  "from-emerald-500 to-teal-500",
  "from-green-500 to-lime-400",
  "from-teal-600 to-emerald-400",
  "from-lime-500 to-green-600",
  "from-emerald-600 to-green-400",
];

function gradientFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return FALLBACK_GRADIENTS[Math.abs(hash) % FALLBACK_GRADIENTS.length];
}

export type MediaCardProps = {
  /** When set, the whole card becomes a link to this href. */
  href?: string;
  /** Image URL. If missing or it fails to load, a gradient fallback is shown. */
  image?: string | null;
  /** Alt text for the image (also seeds the fallback gradient colour). */
  imageAlt?: string;
  /** Aspect ratio of the media area. Defaults to 16:9. */
  aspect?: MediaCardAspect;
  /** Icon centred on the gradient fallback when there is no image. */
  fallbackIcon?: React.ReactNode;
  /** Absolutely-positioned content layered over the image (badges, labels…). */
  overlay?: React.ReactNode;
  /** Dark gradient scrim beneath the overlay so light text/badges stay legible. */
  scrim?: boolean;
  /** Card body content. */
  children: React.ReactNode;
  /** Extra classes for the outer card. */
  className?: string;
  /** Extra classes for the body wrapper (e.g. `space-y-2`). */
  bodyClassName?: string;
};

export function MediaCard({
  href,
  image,
  imageAlt = "",
  aspect = "video",
  fallbackIcon,
  overlay,
  scrim = true,
  children,
  className,
  bodyClassName,
}: MediaCardProps) {
  const [failed, setFailed] = React.useState(false);
  const showImage = Boolean(image) && !failed;

  const card = (
    <Card
      className={cn(
        "overflow-hidden h-full flex flex-col transition-all duration-200",
        "hover:shadow-lg hover:-translate-y-1 hover:border-[var(--border-strong)]",
        className,
      )}
    >
      {/* Media area */}
      <div className={cn("relative w-full overflow-hidden bg-[var(--surface-2)]", ASPECT[aspect])}>
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image as string}
            alt={imageAlt}
            loading="lazy"
            onError={() => setFailed(true)}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center bg-gradient-to-br",
              gradientFor(imageAlt || "eduportal"),
            )}
          >
            <span className="text-white/85" aria-hidden>
              {fallbackIcon ?? <Icon.Camera size={30} />}
            </span>
          </div>
        )}

        {scrim && showImage && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
        )}

        {overlay && <div className="absolute inset-0 pointer-events-none">{overlay}</div>}
      </div>

      {/* Body */}
      <div className={cn("flex-1 flex flex-col p-4", bodyClassName)}>{children}</div>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="group block h-full">
        {card}
      </Link>
    );
  }
  return <div className="group h-full">{card}</div>;
}
