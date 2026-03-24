import { CircleOff } from "lucide-react";

interface AccessDeniedStateProps {
  minHeightClassName?: string;
}

export function AccessDeniedState({
  minHeightClassName = "min-h-[400px]",
}: AccessDeniedStateProps) {
  return (
    <div
      className={`flex ${minHeightClassName} flex-col items-center justify-center space-y-4`}
    >
      <CircleOff className="size-16 text-muted-foreground" aria-hidden="true" />
      <h2 className="text-xl font-semibold">Access Denied</h2>
      <p className="text-muted-foreground">
        You don&apos;t have permission to access this page.
      </p>
    </div>
  );
}
