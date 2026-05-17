import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.identifier || !credentials?.password) {
            return null;
          }

          const identifier = credentials.identifier as string;
          const password = credentials.password as string;

          // Find user by email or phone
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: identifier.toLowerCase() },
                { phone: identifier },
              ],
            },
          });

          if (!user || !user.passwordHash) {
            return null;
          }

          const isValid = await bcrypt.compare(password, user.passwordHash);
          if (!isValid) {
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          };
        } catch (error) {
          console.error("Auth authorize error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      // Safely attach onboarding status — don't crash if DB is down
      try {
        if (token.id) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { onboardingCompleted: true, name: true, image: true },
          });
          if (dbUser) {
            token.onboardingCompleted = dbUser.onboardingCompleted;
            token.name = dbUser.name;
            token.picture = dbUser.image;
          }
        }
      } catch (error) {
        console.error("JWT callback DB lookup failed:", error);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        (session as any).onboardingCompleted = token.onboardingCompleted as boolean;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
