"use client";

import * as React from "react";
import { useLinkStatus } from "next/link";
import Icon from "@/components/icons";

/**
 * Sidebar nav icon that swaps to a spinner the instant its <Link> is clicked,
 * giving immediate feedback while the destination route loads. Must be rendered
 * as a descendant of a <Link>. When the route is already prefetched the
 * navigation is instant and the pending state is skipped.
 */
export function NavLinkIcon({
  icon: IconCmp,
  size = 18,
}: {
  icon: (p: { size?: number }) => React.ReactElement;
  size?: number;
}) {
  const { pending } = useLinkStatus();
  return pending ? <Icon.Loader size={size} /> : <IconCmp size={size} />;
}
