# Auth & Access Control Test Checklist

Run these checks after connecting PostgreSQL, running Prisma migrations, and running `npm run db:seed`.

## 1. Environment & Seed Verification
- [ ] `npx prisma migrate dev` (or `deploy`) completes cleanly against the database.
- [ ] `npm run db:seed` creates/updates the `ADMIN` user matching `ADMIN_EMAIL` with `emailVerified = true`, `isActive = true`, `banned = false`, and seeds all 16 categories.
- [ ] Confirm no secrets appear in client bundles or logs.

## 2. Public & Unauthenticated Guardrails
- [ ] Visiting `/admin`, `/admin/provider-accounts`, `/dashboard`, `/account/change-password` while signed out redirects to `/login?returnTo=...`.
- [ ] Calling `/login?returnTo=https://evil.com` or `//evil.com` falls back to `/` (no open redirect).
- [ ] Calling `POST /api/auth/sign-up/email` directly returns an error (`disableSignUp: true` — public email sign-up is disabled).
- [ ] Calling `POST /api/phone/send-otp` or `POST /api/phone/verify-otp` while signed out returns `401`.

## 3. Visitor Google OAuth Sign-In
- [ ] Signing in via Google with any non-`ADMIN_EMAIL` address creates a user with `role = "VISITOR"`, `isActive = true`, `banned = false`, `mustChangePassword = false`.
- [ ] Visiting `/admin` or `/dashboard` as a `VISITOR` redirects to `/unauthorized`.
- [ ] Header shows visitor name + "تسجيل الخروج" (`LogoutButton`), and clicking logout signs out and redirects to `/login`.

## 4. Admin Google OAuth Sign-In & Role Enforcement
- [ ] Signing in via Google with `ADMIN_EMAIL` (verified email) links/logs into the `ADMIN` user (`role = "ADMIN"`).
- [ ] Visiting `/admin` succeeds and displays link to `/admin/provider-accounts`.
- [ ] Visiting `/dashboard` as `ADMIN` redirects to `/admin`.

## 5. Admin Plugin Hardening & Privilege Escalation Checks
- [ ] **Impersonation disabled:** Calling `POST /api/auth/admin/impersonate-user` or `POST /api/auth/admin/stop-impersonating` returns `404` (even when authenticated as `ADMIN`).
- [ ] **No unauthenticated or non-admin access:** Calling any `/api/auth/admin/*` endpoint (`list-users`, `get-user`, `create-user`, `update-user`, `set-role`, `ban-user`, `unban-user`, `list-user-sessions`, `revoke-user-session`, `revoke-user-sessions`, `remove-user`, `set-user-password`, `has-permission`) returns:
  - `401` when unauthenticated
  - `403` when authenticated as `VISITOR` or `PROVIDER`
- [ ] **Admin-created accounts are PROVIDER only:** Calling `POST /api/auth/admin/create-user` as `ADMIN` with `role: "ADMIN"`, `role: "VISITOR"`, or `email: ADMIN_EMAIL` is rejected (`403`).
- [ ] **ADMIN role cannot be granted via set-role/update-user:** Calling `POST /api/auth/admin/set-role` or `POST /api/auth/admin/update-user` as `ADMIN` to set `role: "ADMIN"` on any other user (or an unverified user) is rejected (`403`).

## 6. Provider Account Lifecycle & Forced Password Change
- [ ] Admin creates a provider account on `/admin/provider-accounts` -> user created with `role = "PROVIDER"`, `mustChangePassword = true`, `emailVerified = true`, `isActive = true`.
- [ ] Provider signs in on `/login` with the temporary password -> redirected to `/dashboard` -> `requireProviderPage()` redirects to `/account/change-password`.
- [ ] Provider changes password on `/account/change-password` -> `mustChangePassword` becomes `false`, other sessions revoked, redirected to `/dashboard`.
- [ ] Admin resets a provider's password -> `mustChangePassword` becomes `true`, existing provider sessions are immediately revoked, provider must change password on next login.

## 7. Single Deactivation Mechanism (`isActive` + `banned` Sync)
- [ ] Admin toggles provider status to deactivated (`isActive = false`):
  - DB row has `isActive = false`, `banned = true`, `banReason` set, `banExpires = null`.
  - All existing `Session` rows for that user are deleted immediately.
  - Active provider browser session fails on next request/navigation (redirects to `/login`) — cookie cache does not keep them logged in.
  - Attempting to sign in again with email/password fails with account deactivated error.
- [ ] Admin reactivates provider (`isActive = true`):
  - DB row has `isActive = true`, `banned = false`, `banReason = null`, `banExpires = null`.
  - Provider can sign in again.

## 8. Phone OTP Verification Plumbing
- [ ] Authenticated user calls `POST /api/phone/send-otp` with `"01012345678"` -> normalized to `"+201012345678"`, 6-digit OTP logged in dev console (`SMS_PROVIDER="console"`), hashed OTP stored in `Verification`.
- [ ] Invalid phone format (e.g. `"12345"`) returns `400`.
- [ ] Requesting a second OTP within 60 seconds returns `429`.
- [ ] Submitting wrong OTP increments attempt count; 5 wrong attempts invalidate the OTP (`429`).
- [ ] Submitting valid OTP within 5 minutes sets `User.phone = "+201012345678"` and `User.phoneVerifiedAt` to current timestamp, deletes `Verification` row, and `requirePhoneVerified()` succeeds.
- [ ] Attempting to verify a phone number already owned by another user returns `409`.

