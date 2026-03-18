// server/utils/auth.ts
// Auth utilities — password hashing, session management, cookie helpers

import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import type { H3Event } from "h3";
import prisma from "./prisma";

const SALT_ROUNDS = 12;
const SESSION_COOKIE = "CashPlow-session";
const SESSION_MAX_AGE = 3 * 24 * 60 * 60; // 3 days in seconds

// ── Password helpers ─────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ── Session helpers ──────────────────────────────────────────

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createSession(userId: string, event: H3Event) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  await prisma.session.create({
    data: { token, userId, expiresAt },
  });

  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  return token;
}

export async function deleteSession(event: H3Event) {
  const token = getCookie(event, SESSION_COOKIE);
  if (token) {
    await prisma.session
      .deleteMany({ where: { token } })
      .catch((err) => console.error("[Auth DB Error]", err));
  }
  deleteCookie(event, SESSION_COOKIE, { path: "/" });
}

// ── Get current user from session ────────────────────────────

export async function getUserFromSession(event: H3Event) {
  const token = getCookie(event, SESSION_COOKIE);
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          currency: true,
          locale: true,
          createdAt: true,
        },
      },
    },
  });

  if (!session) return null;

  // Check expiry
  if (session.expiresAt < new Date()) {
    await prisma.session
      .delete({ where: { id: session.id } })
      .catch((err) => console.error("[Auth DB Error]", err));
    deleteCookie(event, SESSION_COOKIE, { path: "/" });
    return null;
  }

  return session.user;
}

// ── Require auth (throws 401 if not authenticated) ───────────

export async function requireAuth(event: H3Event) {
  const user = await getUserFromSession(event);
  if (!user) {
    throw createError({
      statusCode: 401,
      message: "Silakan login terlebih dahulu",
    });
  }
  return user;
}

// ── Cleanup expired sessions (call periodically) ─────────────

export async function cleanupExpiredSessions() {
  await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}
