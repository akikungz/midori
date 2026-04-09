import { InstancesClient } from "@midori/components/instances/InstancesClient";
import { requireServerSession } from "@midori/lib/server-auth";
import { createServerApiClient } from "@midori/lib/server-api";
import { buildSemesterInstanceNotice } from "@midori/lib/semester-notice";
import { SemesterInstanceNotice } from "@midori/components/shared/SemesterInstanceNotice";

export default async function InstancesPage() {
  const [{ role }, api] = await Promise.all([
    requireServerSession(),
    createServerApiClient(),
  ]);
  const isStudent = role === "STUDENT";

  const semesterNoticeData = isStudent
    ? await Promise.all([
        api.GET("/api/academic/semesters/current"),
        api.GET("/api/academic/semesters", {
          params: {
            query: {
              page: 1,
              pageSize: 100,
            },
          },
        }),
      ])
    : null;

  const semesterInstanceNotice =
    isStudent && semesterNoticeData
      ? buildSemesterInstanceNotice({
          currentSemester: semesterNoticeData[0].data,
          semesters: semesterNoticeData[1].data?.values,
        })
      : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Instances</h1>
          <p className="text-muted-foreground">
            Manage your virtual machine instances
          </p>
        </div>
      </div>

      {semesterInstanceNotice ? (
        <SemesterInstanceNotice notice={semesterInstanceNotice} />
      ) : null}

      <InstancesClient userRole={role} />
    </div>
  );
}
