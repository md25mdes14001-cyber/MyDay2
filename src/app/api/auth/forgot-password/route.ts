import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const forgotSchema = z.object({
  identifier: z.string().min(1, "Email or phone required"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = forgotSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { identifier } = result.data;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { phone: identifier },
        ],
      },
    });

    // Always return success to prevent user enumeration
    if (!user) {
      return NextResponse.json({ message: "If an account exists, a reset link has been sent." });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.verificationToken.create({
      data: {
        identifier: user.email || user.phone || user.id,
        token: resetToken,
        expires,
      },
    });

    // In production: send email/SMS with the resetToken link
    // For now, log it (replace with email service integration)
    console.log(`[Password Reset] Token for ${identifier}: ${resetToken}`);

    return NextResponse.json({ message: "If an account exists, a reset link has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
