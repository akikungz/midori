/** biome-ignore-all lint/suspicious/noArrayIndexKey: For loading elements */
import { Skeleton } from "@midori/components/ui/skeleton";

type LoadingVariant = "cards" | "list" | "detail" | "grid";

interface LoadingStateProps {
  variant?: LoadingVariant;
  count?: number;
  className?: string;
}

/**
 * Common loading skeleton patterns for different layouts
 */
export function LoadingState({
  variant = "list",
  count = 5,
  className = "",
}: LoadingStateProps) {
  switch (variant) {
    case "cards":
      return (
        <div className={`space-y-6 ${className}`}>
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: count }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      );

    case "grid":
      return (
        <div className={`space-y-6 ${className}`}>
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: count }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      );

    case "detail":
      return (
        <div className={`space-y-6 ${className}`}>
          <div className="flex items-center gap-4">
            <Skeleton className="size-10" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-64" />
        </div>
      );
    default:
      return (
        <div className={`space-y-6 ${className}`}>
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </div>
      );
  }
}

/**
 * Loading skeleton for page headers with optional action button
 */
export function HeaderSkeleton({
  showAction = true,
}: {
  showAction?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      {showAction && <Skeleton className="h-10 w-32" />}
    </div>
  );
}

/**
 * Loading skeleton for form fields inside dialogs
 */
export function FormSkeleton({ fields = 3 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}
