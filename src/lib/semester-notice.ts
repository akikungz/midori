import type { ApiDate } from "@midori/types/admin";

const SEMESTER_END_WARNING_DAYS = 15;
const INSTANCE_CLEAR_WINDOW_DAYS = 30;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

interface SemesterNoticeSource {
  name: string;
  endDate: ApiDate;
}

export interface SemesterInstanceNotice {
  title: string;
  description: string;
}

function toDate(value: ApiDate): Date | null {
  if (!value || typeof value === "object") {
    return null;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function toStartOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function buildSemesterInstanceNotice({
  currentSemester,
  semesters = [],
  now = new Date(),
}: {
  currentSemester?: SemesterNoticeSource | null;
  semesters?: SemesterNoticeSource[];
  now?: Date;
}): SemesterInstanceNotice | null {
  const today = toStartOfDay(now);

  const resolvedCurrentSemester = currentSemester
    ? {
        semester: currentSemester,
        endDate: toDate(currentSemester.endDate),
      }
    : null;

  const activeSemesterCandidate =
    resolvedCurrentSemester?.endDate != null
      ? resolvedCurrentSemester
      : null;

  const recentEndedSemesterCandidate = semesters
    .map((semester) => ({
      semester,
      endDate: toDate(semester.endDate),
    }))
    .filter(
      (item): item is { semester: SemesterNoticeSource; endDate: Date } =>
        item.endDate !== null,
    )
    .sort((left, right) => right.endDate.getTime() - left.endDate.getTime())
    .find((item) => item.endDate.getTime() <= today.getTime());

  const target = activeSemesterCandidate ?? recentEndedSemesterCandidate;

  if (!target || !target.endDate) {
    return null;
  }

  const endDate = toStartOfDay(target.endDate);
  const daysFromSemesterEnd = Math.floor(
    (today.getTime() - endDate.getTime()) / DAY_IN_MS,
  );

  const isBeforeSemesterEndWindow =
    daysFromSemesterEnd >= -SEMESTER_END_WARNING_DAYS && daysFromSemesterEnd < 0;
  const isAfterSemesterEndWindow =
    daysFromSemesterEnd >= 0 && daysFromSemesterEnd <= INSTANCE_CLEAR_WINDOW_DAYS;

  if (!isBeforeSemesterEndWindow && !isAfterSemesterEndWindow) {
    return null;
  }

  if (daysFromSemesterEnd < 0) {
    const daysRemaining = Math.abs(daysFromSemesterEnd);

    return {
      title: "Semester ending soon",
      description: `${target.semester.name} ends in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}. Please back up your data. Instances may be cleared up to ${INSTANCE_CLEAR_WINDOW_DAYS} days after semester end.`,
    };
  }

  if (daysFromSemesterEnd === 0) {
    return {
      title: "Semester ends today",
      description: `${target.semester.name} ends today. Please back up your data. Instance cleanup may begin during the next ${INSTANCE_CLEAR_WINDOW_DAYS} days.`,
    };
  }

  const daysUntilClear = Math.max(
    0,
    INSTANCE_CLEAR_WINDOW_DAYS - daysFromSemesterEnd,
  );

  return {
    title: "Semester has ended",
    description:
      daysUntilClear > 0
        ? `${target.semester.name} ended ${daysFromSemesterEnd} day${daysFromSemesterEnd === 1 ? "" : "s"} ago. Your instance may be cleared in ${daysUntilClear} day${daysUntilClear === 1 ? "" : "s"}. Please back up important files now.`
        : `${target.semester.name} ended ${daysFromSemesterEnd} days ago. Instance cleanup may happen now. Please ensure all important files are backed up.`,
  };
}
