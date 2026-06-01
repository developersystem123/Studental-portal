import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 20, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const Icon = {
  Logo: (p: IconProps) => (
    <Base {...p}>
      <path d="M3 8.5 12 4l9 4.5-9 4.5-9-4.5Z" />
      <path d="M7 10.5v4.2a2 2 0 0 0 1.2 1.84l3.2 1.4a2 2 0 0 0 1.6 0l3.2-1.4A2 2 0 0 0 17 14.7v-4.2" />
      <path d="M21 8.5V14" />
    </Base>
  ),
  Mail: (p: IconProps) => (
    <Base {...p}>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <path d="m3 6 9 7 9-7" />
    </Base>
  ),
  Lock: (p: IconProps) => (
    <Base {...p}>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </Base>
  ),
  Eye: (p: IconProps) => (
    <Base {...p}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </Base>
  ),
  EyeOff: (p: IconProps) => (
    <Base {...p}>
      <path d="M3 3l18 18" />
      <path d="M10.5 10.7a2 2 0 0 0 2.8 2.8" />
      <path d="M9.4 5.6A10 10 0 0 1 22 12c-.7 1.4-1.7 2.7-2.9 3.7M6.2 6.2A11.8 11.8 0 0 0 2 12s3.5 7 10 7c1.7 0 3.3-.4 4.7-1" />
    </Base>
  ),
  Google: (p: IconProps) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 48 48" {...p}>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5 17.6 35.5 12.5 30.4 12.5 24S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.9 6.4 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.8 0 19.5-7.7 19.5-19.5 0-1.2-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.1 6.6 4.8C14.6 15.1 18.9 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.9 6.4 29.2 4.5 24 4.5 16.3 4.5 9.7 8.3 6.3 14.1z" />
      <path fill="#4CAF50" d="M24 43.5c5.1 0 9.7-1.9 13.2-5l-6.1-5c-2 1.4-4.5 2.3-7.1 2.3-5.3 0-9.7-3.1-11.3-7.4l-6.6 5.1C9.7 39.7 16.3 43.5 24 43.5z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.6l6.1 5c-.4.4 6.8-5 6.8-14.6 0-1.2-.1-2.4-.4-3.5z" />
    </svg>
  ),
  Search: (p: IconProps) => (
    <Base {...p}>
      <circle cx="11" cy="11" r="7.5" />
      <path d="m20 20-3.5-3.5" />
    </Base>
  ),
  Bell: (p: IconProps) => (
    <Base {...p}>
      <path d="M6 8a6 6 0 0 1 12 0c0 4 1.5 5.5 2.5 6.5H3.5C4.5 13.5 6 12 6 8Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </Base>
  ),
  Menu: (p: IconProps) => (
    <Base {...p}>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </Base>
  ),
  X: (p: IconProps) => (
    <Base {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Base>
  ),
  Sun: (p: IconProps) => (
    <Base {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Base>
  ),
  Moon: (p: IconProps) => (
    <Base {...p}>
      <path d="M21 13.5A9 9 0 1 1 10.5 3a7 7 0 0 0 10.5 10.5Z" />
    </Base>
  ),
  Home: (p: IconProps) => (
    <Base {...p}>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </Base>
  ),
  Book: (p: IconProps) => (
    <Base {...p}>
      <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z" />
      <path d="M4 20a2 2 0 0 1 2-2h13" />
    </Base>
  ),
  Compass: (p: IconProps) => (
    <Base {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5.5-5.5 2 2-5.5 5.5-2Z" />
    </Base>
  ),
  Award: (p: IconProps) => (
    <Base {...p}>
      <circle cx="12" cy="9" r="6" />
      <path d="m8.5 14-1.5 7 5-3 5 3-1.5-7" />
    </Base>
  ),
  User: (p: IconProps) => (
    <Base {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </Base>
  ),
  Sparkles: (p: IconProps) => (
    <Base {...p}>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2 2M16.4 16.4l2 2M5.6 18.4l2-2M16.4 7.6l2-2" />
      <circle cx="12" cy="12" r="2" />
    </Base>
  ),
  MessageSquare: (p: IconProps) => (
    <Base {...p}>
      <path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.4A8 8 0 1 1 21 12Z" />
    </Base>
  ),
  ListChecks: (p: IconProps) => (
    <Base {...p}>
      <path d="m3 7 2 2 4-4" />
      <path d="m3 14 2 2 4-4" />
      <path d="M13 7h8M13 16h8" />
    </Base>
  ),
  FilePen: (p: IconProps) => (
    <Base {...p}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
      <path d="M18 2.5 21.5 6 14 13.5l-4 1 1-4 7-7Z" />
    </Base>
  ),
  Play: (p: IconProps) => (
    <Base {...p}>
      <path d="M6 4v16l14-8L6 4Z" fill="currentColor" />
    </Base>
  ),
  Pause: (p: IconProps) => (
    <Base {...p}>
      <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" />
      <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" />
    </Base>
  ),
  Fullscreen: (p: IconProps) => (
    <Base {...p}>
      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
    </Base>
  ),
  Volume: (p: IconProps) => (
    <Base {...p}>
      <path d="M4 10v4h3l5 4V6l-5 4H4Z" fill="currentColor" />
      <path d="M16 8a5 5 0 0 1 0 8" />
    </Base>
  ),
  Check: (p: IconProps) => (
    <Base {...p}>
      <path d="m5 12 5 5L20 7" />
    </Base>
  ),
  CheckCircle: (p: IconProps) => (
    <Base {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </Base>
  ),
  Circle: (p: IconProps) => (
    <Base {...p}>
      <circle cx="12" cy="12" r="9" />
    </Base>
  ),
  ChevronDown: (p: IconProps) => (
    <Base {...p}>
      <path d="m6 9 6 6 6-6" />
    </Base>
  ),
  ChevronLeft: (p: IconProps) => (
    <Base {...p}>
      <path d="m15 6-6 6 6 6" />
    </Base>
  ),
  ChevronRight: (p: IconProps) => (
    <Base {...p}>
      <path d="m9 6 6 6-6 6" />
    </Base>
  ),
  ArrowLeft: (p: IconProps) => (
    <Base {...p}>
      <path d="M19 12H5m0 0 6-6m-6 6 6 6" />
    </Base>
  ),
  ArrowUp: (p: IconProps) => (
    <Base {...p}>
      <path d="M12 19V5m0 0-6 6m6-6 6 6" />
    </Base>
  ),
  Plus: (p: IconProps) => (
    <Base {...p}>
      <path d="M12 5v14M5 12h14" />
    </Base>
  ),
  Trash: (p: IconProps) => (
    <Base {...p}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </Base>
  ),
  Download: (p: IconProps) => (
    <Base {...p}>
      <path d="M12 3v12m0 0 5-5m-5 5-5-5" />
      <path d="M5 21h14" />
    </Base>
  ),
  Send: (p: IconProps) => (
    <Base {...p}>
      <path d="m4 12 16-8-6 16-2.5-6L4 12Z" />
    </Base>
  ),
  Filter: (p: IconProps) => (
    <Base {...p}>
      <path d="M4 4h16l-6 8v6l-4 2v-8L4 4Z" />
    </Base>
  ),
  Star: (p: IconProps) => (
    <Base {...p}>
      <path d="m12 3 2.9 5.9 6.6.96-4.8 4.7 1.1 6.5L12 18l-5.9 3.1 1.1-6.5L2.5 9.86l6.6-.96L12 3Z" />
    </Base>
  ),
  Clock: (p: IconProps) => (
    <Base {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Base>
  ),
  Calendar: (p: IconProps) => (
    <Base {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </Base>
  ),
  TrendingUp: (p: IconProps) => (
    <Base {...p}>
      <path d="m3 17 6-6 4 4 8-9" />
      <path d="M14 6h7v7" />
    </Base>
  ),
  PieChart: (p: IconProps) => (
    <Base {...p}>
      <path d="M21 12A9 9 0 1 1 12 3v9h9Z" />
      <path d="M21 12a9 9 0 0 0-9-9v9h9Z" />
    </Base>
  ),
  BarChart3: (p: IconProps) => (
    <Base {...p}>
      <path d="M3 3v18h18" />
      <path d="M7 17V9M12 17V5M17 17v-6" />
    </Base>
  ),
  Users: (p: IconProps) => (
    <Base {...p}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M16 20a5 5 0 0 1 5-5" />
    </Base>
  ),
  Settings: (p: IconProps) => (
    <Base {...p}>
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.3 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.3l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1A2 2 0 1 1 19.7 7l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </Base>
  ),
  Logout: (p: IconProps) => (
    <Base {...p}>
      <path d="M15 12H4m0 0 4-4m-4 4 4 4" />
      <path d="M9 4h9a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-9" />
    </Base>
  ),
  Megaphone: (p: IconProps) => (
    <Base {...p}>
      <path d="M3 11v2a3 3 0 0 0 3 3h2l8 4V4l-8 4H6a3 3 0 0 0-3 3Z" />
      <path d="M19 8a4 4 0 0 1 0 8" />
    </Base>
  ),
  Camera: (p: IconProps) => (
    <Base {...p}>
      <path d="M4 8h3l2-3h6l2 3h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" />
      <circle cx="12" cy="13" r="4" />
    </Base>
  ),
  Loader: (p: IconProps) => (
    <svg
      width={p.size ?? 20}
      height={p.size ?? 20}
      viewBox="0 0 24 24"
      fill="none"
      className={`animate-spin ${p.className ?? ""}`}
      {...p}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Spark: (p: IconProps) => (
    <Base {...p}>
      <path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M5 19l4-4M15 9l4-4" />
    </Base>
  ),
  Heart: (p: IconProps) => (
    <Base {...p}>
      <path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9Z" />
    </Base>
  ),
  CreditCard: (p: IconProps) => (
    <Base {...p}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18M7 15h4" />
    </Base>
  ),
  Video: (p: IconProps) => (
    <Base {...p}>
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="M16 10l5-3v10l-5-3" />
    </Base>
  ),
  Help: (p: IconProps) => (
    <Base {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 1 1 4 2c-.8.5-1.5 1-1.5 2" />
      <path d="M12 17h.01" />
    </Base>
  ),
  Tag: (p: IconProps) => (
    <Base {...p}>
      <path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9Z" />
      <circle cx="8.5" cy="7.5" r="1.5" fill="currentColor" />
    </Base>
  ),
  AlertCircle: (p: IconProps) => (
    <Base {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6M12 17h.01" />
    </Base>
  ),
  Inbox: (p: IconProps) => (
    <Base {...p}>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.4 5.5h13.2l3.4 6.5v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6Z" />
    </Base>
  ),
  Pin: (p: IconProps) => (
    <Base {...p}>
      <path d="M12 17v5" />
      <path d="M8 5l8 0M9 5v6l-3 3h12l-3-3V5" />
    </Base>
  ),
  Globe: (p: IconProps) => (
    <Base {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </Base>
  ),
  Save: (p: IconProps) => (
    <Base {...p}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M7 3v6h8V3M7 21v-8h10v8" />
    </Base>
  ),
  DollarSign: (p: IconProps) => (
    <Base {...p}>
      <path d="M12 2v20" />
      <path d="M17 6.5a4 4 0 0 0-4-2.5h-2a3.5 3.5 0 0 0 0 7h2a3.5 3.5 0 0 1 0 7h-2a4 4 0 0 1-4-2.5" />
    </Base>
  ),
  Mic: (p: IconProps) => (
    <Base {...p}>
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </Base>
  ),
  Edit: (p: IconProps) => (
    <Base {...p}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </Base>
  ),
  Copy: (p: IconProps) => (
    <Base {...p}>
      <rect x="8" y="8" width="13" height="13" rx="2" />
      <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
    </Base>
  ),
  PlayCircle: (p: IconProps) => (
    <Base {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="m10 8 6 4-6 4V8Z" fill="currentColor" />
    </Base>
  ),
  Wallet: (p: IconProps) => (
    <Base {...p}>
      <path d="M3 7h15a3 3 0 0 1 3 3v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
      <path d="M3 7V6a2 2 0 0 1 2-2h11" />
      <circle cx="17" cy="13.5" r="1.25" fill="currentColor" />
    </Base>
  ),
  ThumbsUp: (p: IconProps) => (
    <Base {...p}>
      <path d="M7 22V11" />
      <path d="M14 9V5a3 3 0 0 0-6 0v6h11a2 2 0 0 1 2 2.3l-1.4 7A2 2 0 0 1 17.6 22H7" />
    </Base>
  ),
  StarFill: (p: IconProps) => (
    <svg
      width={p.size ?? 20}
      height={p.size ?? 20}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinejoin="round"
      {...p}
    >
      <path d="m12 3 2.9 5.9 6.6.96-4.8 4.7 1.1 6.5L12 18l-5.9 3.1 1.1-6.5L2.5 9.86l6.6-.96L12 3Z" />
    </svg>
  ),
  Route: (p: IconProps) => (
    <Base {...p}>
      <circle cx="6" cy="19" r="3" />
      <circle cx="18" cy="5" r="3" />
      <path d="M9 19h5.5a3.5 3.5 0 0 0 0-7h-4a3.5 3.5 0 0 1 0-7H15" />
    </Base>
  ),
  Bookmark: (p: IconProps) => (
    <Base {...p}>
      <path d="M5 3h14a2 2 0 0 1 2 2v16l-9-4-9 4V5a2 2 0 0 1 2-2Z" />
    </Base>
  ),
  Crown: (p: IconProps) => (
    <Base {...p}>
      <path d="M3 7l4.5 4L12 4l4.5 7L21 7l-1.7 11H4.7L3 7Z" />
      <path d="M4.7 18h14.6" />
    </Base>
  ),
  Smile: (p: IconProps) => (
    <Base {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 14.5s1 1.5 3.5 1.5 3.5-1.5 3.5-1.5" />
      <circle cx="9" cy="9.5" r="1" fill="currentColor" />
      <circle cx="15" cy="9.5" r="1" fill="currentColor" />
    </Base>
  ),
};

export default Icon;
