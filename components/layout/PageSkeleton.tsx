import { Card, CardBody, Skeleton } from "@/components/ui";

/**
 * Route-level loading fallback. Rendered instantly on navigation via the
 * `loading.tsx` Suspense boundary so a clicked page opens with immediate
 * visual feedback while its content streams in.
 */
export default function PageSkeleton() {
  return (
    <div className="space-y-6 fade-in">
      {/* Page header */}
      <div className="space-y-2.5">
        <Skeleton className="h-3 w-24 rounded-full" />
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardBody className="flex items-start gap-3">
              <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2 pt-0.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Main content card */}
      <Card>
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-3">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
          <div className="ml-auto">
            <Skeleton className="h-9 w-48 rounded-xl" />
          </div>
        </div>
        <CardBody className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
