import Icon from "@/components/icons";

export function PortalLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="flex items-center gap-2 text-[var(--muted)] text-sm font-medium">
        <Icon.Loader size={20} />
        Loading…
      </div>
    </div>
  );
}

export default PortalLoader;
