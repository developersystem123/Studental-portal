"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import Icon from "@/components/icons";

/**
 * Press contact button. Copies the email to the clipboard (with feedback)
 * instead of relying on a mailto: handler, which fails when no mail app is set.
 * Falls back to opening the mail client if the Clipboard API is unavailable.
 */
export function CopyEmailButton({
  email,
  size = "lg",
  className,
}: {
  email: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (e.g. insecure context) — fall back to mail client.
      window.location.href = `mailto:${email}`;
    }
  }

  return (
    <Button size={size} type="button" onClick={handleClick} className={className}>
      {copied ? <Icon.Check size={16} /> : <Icon.Mail size={16} />}
      {copied ? "Copied!" : email}
    </Button>
  );
}
