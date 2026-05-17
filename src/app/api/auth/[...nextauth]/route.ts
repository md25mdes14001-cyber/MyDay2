import { handlers } from "@/lib/auth";
import { NextRequest } from "next/server";

// Wrap handlers with error catching to prevent HTML error pages
// and log the actual error to the terminal
export const GET = async (req: NextRequest, ctx: { params: Promise<{ nextauth: string[] }> }) => {
  try {
    return await handlers.GET(req, ctx);
  } catch (error) {
    console.error("⚠️ AUTH GET ERROR:", error);
    return new Response(JSON.stringify({ error: "Auth configuration error. Check server logs." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST = async (req: NextRequest, ctx: { params: Promise<{ nextauth: string[] }> }) => {
  try {
    return await handlers.POST(req, ctx);
  } catch (error) {
    console.error("⚠️ AUTH POST ERROR:", error);
    return new Response(JSON.stringify({ error: "Auth configuration error. Check server logs." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
