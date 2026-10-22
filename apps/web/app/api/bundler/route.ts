import { NextResponse, type NextRequest } from "next/server";
import { handleJsonRpcProxy } from "@/lib/json-rpc-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  return handleJsonRpcProxy(request, "bundler");
}

export function GET() {
  return NextResponse.json(
    {
      error: {
        code: -32601,
        message: "Use POST for the Conform bundler relay.",
      },
    },
    { status: 405, headers: { allow: "POST" } },
  );
}
