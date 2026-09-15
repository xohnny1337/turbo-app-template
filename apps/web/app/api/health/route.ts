import { NextResponse } from "next/server";

import type { HealthResponse } from "@repo/types";

export function GET() {
  const body: HealthResponse = {
    status: "ok",
    timestamp: new Date().toISOString(),
  };
  return NextResponse.json(body);
}
