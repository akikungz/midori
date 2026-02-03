import { NextResponse } from "next/server";
import { getMetrics, getMetricsContentType } from "@midori/lib/metrics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
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
    console.error("Error collecting metrics:", error);
    return NextResponse.json(
      { error: "Failed to collect metrics" },
      { status: 500 },
    );
  }
}
