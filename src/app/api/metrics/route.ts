import { NextResponse } from "next/server";
import {
  getMetrics,
  getMetricsContentType,
  httpRequestDuration,
  httpRequestsTotal,
} from "@midori/lib/metrics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request): Promise<NextResponse> {
  const startTime = process.hrtime.bigint();
  const method = request.method;
  const path = new URL(request.url).pathname;

  try {
    await getMetrics();

    const durationSeconds =
      Number(process.hrtime.bigint() - startTime) / 1_000_000_000;
    httpRequestsTotal.inc({ method, path, status: "200" });
    httpRequestDuration.observe(
      { method, path, status: "200" },
      durationSeconds,
    );

    const metrics = await getMetrics();

    return new NextResponse(metrics, {
      status: 200,
      headers: {
        "Content-Type": getMetricsContentType(),
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    const durationSeconds =
      Number(process.hrtime.bigint() - startTime) / 1_000_000_000;
    httpRequestsTotal.inc({ method, path, status: "500" });
    httpRequestDuration.observe(
      { method, path, status: "500" },
      durationSeconds,
    );
    console.error("Error collecting metrics:", error);
    return NextResponse.json(
      { error: "Failed to collect metrics" },
      { status: 500 },
    );
  }
}
