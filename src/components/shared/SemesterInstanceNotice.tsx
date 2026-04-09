import { TriangleAlert } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@midori/components/ui/alert";
import type { SemesterInstanceNotice as SemesterInstanceNoticeData } from "@midori/lib/semester-notice";

interface SemesterInstanceNoticeProps {
  notice: SemesterInstanceNoticeData;
}

export function SemesterInstanceNotice({
  notice,
}: SemesterInstanceNoticeProps) {
  return (
    <Alert className="border-amber-300/50 bg-amber-50/80 text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-100 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-300">
      <TriangleAlert />
      <AlertTitle>{notice.title}</AlertTitle>
      <AlertDescription>{notice.description}</AlertDescription>
    </Alert>
  );
}
