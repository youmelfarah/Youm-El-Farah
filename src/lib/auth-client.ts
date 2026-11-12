"use client";

import { createAuthClient } from "better-auth/react";
import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";
import { ac, authRoles } from "@/lib/auth-permissions";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [
    adminClient({
      ac,
      roles: authRoles,
    }),
    inferAdditionalFields<typeof auth>(),
  ],
});

export const {
  signIn,
  signOut,
  signUp,
  useSession,
} = authClient;
