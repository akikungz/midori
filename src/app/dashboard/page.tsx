import { redirect } from "next/navigation";

import {
  createServerApiClient,
  getServerSession,
} from "@midori/lib/server-api";
import { DashboardCards } from "@midori/components/dashboard/DashboardCards";

export default async function DashboardPage() {
  const [user, api] = await Promise.all([
    getServerSession(),
    createServerApiClient(),
  ]);

  if (!user) {
    redirect("/login");
  }

  const proxmoxOverviewPromise = api.GET("/api/monitoring/proxmox/overview");
  const dashboardCountsPromise =
    user.role === "STUDENT"
      ? Promise.all([
          api.GET("/api/instances/", {
            params: {
              query: {
                page: 1,
                pageSize: 1,
              },
            },
          }),
          api.GET("/api/requests/", {
            params: {
              query: {
                page: 1,
                pageSize: 1,
              },
            },
          }),
          api.GET("/api/extended-requests/", {
            params: {
              query: {
                page: 1,
                pageSize: 1,
              },
            },
          }),
        ])
      : user.role === "ADMIN" || user.role === "INSTRUCTOR"
        ? Promise.all([
            api.GET(
              user.role === "ADMIN"
                ? "/api/instances/admin"
                : "/api/instances/",
              {
                params: {
                  query: {
                    page: 1,
                    pageSize: 1,
                  },
                },
              },
            ),
            api.GET("/api/requests/", {
              params: {
                query: {
                  page: 1,
                  pageSize: 1,
                  status: "PENDING",
                },
              },
            }),
            api.GET("/api/extended-requests/", {
              params: {
                query: {
                  page: 1,
                  pageSize: 1,
                  status: "PENDING",
                },
              },
            }),
          ])
        : Promise.resolve(null);

  const [{ data: proxmoxOverview }, dashboardCounts] = await Promise.all([
    proxmoxOverviewPromise,
    dashboardCountsPromise,
  ]);

  const dashboardSummary =
    user.role === "STUDENT" && dashboardCounts
      ? {
          title: "My Activity",
          description: "A quick summary of your current instances and requests",
          instanceLabel: "Instances",
          instanceDescription: "Total instances linked to your account",
          requestLabel: "Requests",
          requestDescription: "Instance requests you have submitted",
          extendedRequestLabel: "Extended Requests",
          extendedRequestDescription:
            "Extension requests for your existing instances",
          instanceCount: dashboardCounts[0].data?.totalItems ?? 0,
          requestCount: dashboardCounts[1].data?.totalItems ?? 0,
          extendedRequestCount: dashboardCounts[2].data?.totalItems ?? 0,
        }
      : (user.role === "ADMIN" || user.role === "INSTRUCTOR") && dashboardCounts
        ? {
            title: "Work Queue",
            description:
              user.role === "ADMIN"
                ? "System-wide instance volume and pending review items"
                : "Your instance volume and pending review items",
            instanceLabel: "Instances",
            instanceDescription:
              user.role === "ADMIN"
                ? "Total instances across the platform"
                : "Instances currently in your scope",
            requestLabel: "Pending Requests",
            requestDescription: "Instance requests waiting for review",
            extendedRequestLabel: "Pending Extended Requests",
            extendedRequestDescription: "Extension requests waiting for review",
            instanceCount: dashboardCounts[0].data?.totalItems ?? 0,
            requestCount: dashboardCounts[1].data?.totalItems ?? 0,
            extendedRequestCount: dashboardCounts[2].data?.totalItems ?? 0,
          }
        : undefined;

  return (
    <DashboardCards
      user={user}
      proxmoxOverview={proxmoxOverview}
      dashboardSummary={dashboardSummary}
    />
  );
}
