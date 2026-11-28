# Auth feature — implementation plan

Status: **v3 approved — steps 0 to 2 done**. Findings and notes in §7.

Sources read: `Cas pratique.pdf`, `README.md`, `claude.md`, `AGENTS.md`, `package.json`, `bun.lock`, every file under `src/`, `prisma/schema.prisma`, `prisma/seed.ts`, configs, Figma exports (10 screens + overview, incl. email template and company card component).
To read at step 0: `node_modules/next/dist/docs/` (required by AGENTS.md; deps not installed yet).

### How to read this plan

Every item is tagged with its origin, and the categories are never mixed:

| Tag | Meaning | Can I change it? |
|---|---|---|
| **REQ** | Explicitly stated by the assignment: `PDF §x`, `README`, provided code, or `Figma` | No |
| **CLAR** | Clarification / product decision **given by you** during plan review | No, unless you change it |
| **TECH** | **My own technical decision** — not required by anyone; trade-offs stated | Yes, open to challenge |
| **ASSUME** | Default I apply where nothing is specified and you have not confirmed | Yes, say so and I change it |

---

## 1. Explicit assignment requirements (REQ)

Only what the sources actually say. How I implement each one is in §4 (TECH).

### 1.1 Scope and stack

| ID | Requirement | Source |
|---|---|---|
| REQ-1 | Build the logic **and** display of a full auth flow: sign-in, sign-up, two-step verification (MFA), password reset. | PDF §2 |
| REQ-2 | Good UI/UX, **as faithful as possible to Figma**, built with Next.js. | PDF §2 |
| REQ-3 | App available in **French and English**. Intlayer is recommended. | PDF §2 |
| REQ-4 | With Intlayer, no language switcher is needed: language is changed through the URL (`/fr`, `/en`). | PDF §3 |
| REQ-5 | Stack: Prisma + PostgreSQL, Next.js 16, React Hook Form + Zod, TanStack Query, Better-Auth. | PDF §3 |
| REQ-6 | The auth server part (Better-Auth config, Prisma schema, test accounts) is provided and **does not need to be modified**. Use `authClient`. | PDF §3, README |
| REQ-7 | Page routes for sign-in, sign-up, verification and forgot password are **free to choose**. | PDF §3 |

### 1.2 Functional requirements

| ID | Requirement | Source |
|---|---|---|
| REQ-10 | Page reachable at `/login`, `/en/login`, `/fr/login` — pattern `/{fr,en}/*`. | PDF §4.1 |
| REQ-11 | One card for sign-in **and** sign-up; switching "Connexion" ↔ "Inscription" with **tabs, without page reload**. | PDF §4.1 |
| REQ-12 | Sign-up password: **8 characters minimum**. Sign-up signs the user in. | README |
| REQ-13 | After the password, if the account has 2FA, the **verification screen replaces the form**. | PDF §4.2 |
| REQ-14 | The verification screen **adapts to the account's methods returned by the server at sign-in** (`twoFactorMethods`: `"totp"` and/or `"otp"`): app only → app code entry; app + email → plus a link to receive a code by email; email only → **a code is sent automatically on arrival**. | PDF §3, §4.2, README |
| REQ-15 | Resending a code or a link is limited server-side to **once every 30 s**; the UI must reflect the delay, **including after a page reload**. | PDF §3 |
| REQ-16 | Email-code resend disabled **30 s after each send**, with a **visible countdown**, correct after reload. | PDF §4.3 |
| REQ-17 | Code entered in **six boxes**; a pasted code is spread correctly across the six boxes **whatever box was clicked**; focus moves automatically to the next box; **verification starts as soon as six digits are entered**. | PDF §4.4 |
| REQ-18 | From the verification screen, the user can use a **recovery code** instead, then **come back** to code entry. Each recovery code works once. | PDF §4.5, README |
| REQ-19 | Forgot password: user enters email, then sees the **confirmation screen**. The server gives the same answer whether the account exists or not. | PDF §4.6, README |
| REQ-20 | The reset link (shown on `/code`) opens the **new password page**. An **expired or already used** link shows a **clear error message**. | PDF §4.6 |
| REQ-21 | The reset **email** is viewable at **`/email`**. | PDF §4.7 |
| REQ-22 | After sign-in, the user lands on a page that **clearly shows they are signed in** (any content). It **must not be accessible without a session**. | PDF §3, §4.8 |
| REQ-23 | Server errors must be **shown clearly**: wrong credentials, invalid or expired code, expired link, too many attempts. | PDF §3 |
| REQ-24 | Error and loading states are **not designed** in Figma (they must still exist — see REQ-23). | PDF §3 |
| REQ-25 | Page and the "fleet overlay" responsive and optimized for **1920×1080** and **1400×900**. | PDF §4.9 |

### 1.3 Company cards (background)

| ID | Requirement | Source |
|---|---|---|
| REQ-30 | Provided: sectors (list, colours, icons, `SectorTag`) and `CompanyStatus`. The **rest of the card**, and the **translation of sector names and statuses**, are to be built. | PDF §3, README |
| REQ-31 | Card content (name, description, sectors, status) **returned by the server, not hardcoded in the frontend**; the endpoint and its data are to be created. | PDF §3 |
| REQ-32 | Badges: `CLOSED` and `INACTIVE` → "closed" badge, `ACQUIRED` → "sold" badge, `ACTIVE` → no badge. | `company-status.ts` |

### 1.4 Server contract to honour (README)

| Case | Status / `code` |
|---|---|
| Wrong email or password | 401 `INVALID_EMAIL_OR_PASSWORD` |
| Email already used at sign-up | 422 `USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL` |
| Wrong or expired code | 401 `INVALID_CODE` |
| Sign-in attempt expired (10 min) | 401 `INVALID_TWO_FACTOR_COOKIE` |
| Reset link invalid, expired or used | 400 `INVALID_TOKEN` |
| Too many requests | 429, `X-Retry-After` header = seconds to wait |

Other facts: email codes expire after 3 min, a new one cancels the previous one; a new reset link cancels the previous one; sign-in is limited to 3 attempts / 10 s; the reset link redirects to `redirectTo?token=…`.

### 1.5 Figma (design REQ)

Screen content as designed (FR copy shown; EN to be translated):

| Screen | Content |
|---|---|
| Sign-in tab | "Ravi de vous revoir sur Stolos !" / "Connectez-vous à votre compte"; tabs; email; password (show/hide); "Mot de passe oublié ?"; primary button **"S'inscrire"**; footer "Conditions d'utilisation \| Politique de confidentialité" |
| Sign-up tab | "Bienvenue sur Stolos !" / "Créez votre compte"; email; password; **confirm password**; "Créer mon compte"; same footer. **No name field.** |
| 2FA — app only | "Confirmez votre identité"; 6 boxes; "Utiliser un code de récupération"; "Saisissez le code à six chiffres affiché dans votre application d'authentification." |
| 2FA — app + email | same + "Envoyer un code par courriel"; text "…envoyé à l'adresse courriel de votre compte, ou le code affiché dans votre application d'authentification." (single input) |
| 2FA — email only | same + "Renvoyer un code (30s)"; text "…S'il expire, demandez un nouveau code." |
| Recovery code | "Saisissez un code de récupération"; input; "Valider et se connecter"; "Utiliser un code de vérification"; "Chaque code est à usage unique." |
| Forgot password | "Mot de passe oublié ?"; text; email; "Envoyer le lien"; "Retour à la connexion" |
| Check inbox | "Vérifiez votre boîte courriel"; neutral text; "Renvoyer le lien"; "Retour à la connexion" |
| New password | "Créez un nouveau mot de passe"; subtitle; new + confirm password; "Enregistrer le mot de passe"; "Retour à la connexion" |
| Email | Logo + "Stolos"; "Réinitialisez votre mot de passe"; button "Choisir un nouveau mot de passe"; "…Ce lien expire dans une heure."; ignore notice; raw link; footer "Ceci est un message automatique de Histia. Merci de ne pas y répondre." |
| Background | Company cards left and right, cropped by viewport edges: logo circle with letter, name, description, monochrome sectors, status badge ("Fermée" / "Vendue"), large faint letter watermark |

Visual measurements (my reading of the exports, to be checked during the fidelity pass): 594 px glass card centred, 3D logo top centre, title ~28 px, 48 px fields with floating label like the provided `PasswordInput`, tabs with primary underline, full-width primary button ~50 px, code boxes ~52×80 px with 12 px gap, violet glows top and bottom.

### 1.6 Engineering rules (claude.md)

Strict TS (no `any`, no needless assertions), minimal client state, focused components, safe error handling, no secrets/token storage in JS, no leaked server messages, no unnecessary deps, **strict TDD**, full final gate (tests, `tsc`, ESLint, build, responsive, security review, honest report), **no commit/push without authorization**.

### 1.7 Protected — never modified (REQ-6, claude.md, and your instruction)

| File / area | How new code uses it |
|---|---|
| `src/lib/auth.ts` | imported read-only (`auth.api.getSession`) |
| `src/lib/auth-client.ts` | imported as is |
| `src/app/api/auth/[...all]/route.ts` | called through `authClient` only |
| `prisma/schema.prisma`, `prisma/migrations/**`, `prisma.config.ts` | unchanged — no new model, no migration |
| `prisma/seed.ts`, `src/lib/test-accounts.ts`, `src/lib/prisma.ts` | unchanged |
| `src/app/code/page.tsx` | unchanged |

Prisma is only **read** by new code. If a requirement ever seems to need a change here, I stop and explain before touching anything.

---

## 2. Your clarifications (CLAR)

| ID | Decision | Answers |
|---|---|---|
| CLAR-1 | Figma screens provided (§1.5). | missing Figma access |
| CLAR-2 | No separate fleet feature: the "fleet overlay" = the **background company cards**; in scope and responsive. | PDF title "Flottes" / §4.9 |
| CLAR-3 | Add `zod`, `@hookform/resolvers`, `intlayer`, `next-intlayer`; dev: Vitest, Testing Library, jsdom, Playwright. | deps missing from `package.json` |
| CLAR-4 | Companies from a **server-only data module** via the API, **no Prisma change**. Server returns the **description in the requested locale**; sectors and status are **stable identifiers**, labels translated in the frontend. **Names and logos not translated.** | data source & translation scope |
| CLAR-5 | Sign-up `name` (required by the API, absent in Figma) is **derived from the email** local part. | REQ-12 vs Figma |
| CLAR-6 | App + email: **single input**. Before an email code is requested → `verifyTotp`; after → `verifyOtp`, then `verifyTotp` on `INVALID_CODE`. Accepted trade-off: a wrong code costs two attempts. | Figma single input |
| CLAR-7 | Sign-in tab button keeps Figma label **"S'inscrire"** (en: "Sign up"). | Figma inconsistency |
| CLAR-8 | Company logos = **letter monograms** (letter + colour from the API). | logo assets |
| CLAR-9 | Never modify the provided auth server configuration or Prisma schema (§1.7). | — |

---

## 3. Architecture (TECH)

### Route map — REQ-7 leaves routes free; these choices are mine

| URL | Purpose | Satisfies |
|---|---|---|
| `/{locale}/login` | tabs; 2FA + recovery replace the form | REQ-10, 11, 13, 18 |
| `/{locale}/forgot-password` | email form → check-inbox screen | REQ-19 |
| `/{locale}/reset-password?token=…` / `?error=…` | new password or invalid-link state | REQ-20 |
| `/{locale}/account` | signed-in page, protected | REQ-22 |
| `/{locale}` | redirect by session | — |
| `/email` | rendered reset email | REQ-21 |
| `/api/companies?locale=` | company cards data | REQ-31 |
| `/code`, `/api/auth/*` | provided, untouched | REQ-6 |

### Folder structure

```
src/
  proxy.ts                               # Intlayer locale proxy (Next 16)
  app/
    layout.tsx
    [locale]/
      layout.tsx                         # <html lang>, IntlayerProvider, QueryProvider
      page.tsx
      (auth)/
        layout.tsx                       # glows + logo + company background + card slot
        login/page.tsx  forgot-password/page.tsx  reset-password/page.tsx
      account/page.tsx
    email/page.tsx
    api/companies/route.ts
  features/
    auth/
      components/  auth-card, auth-tabs, sign-in-form, sign-up-form, legal-links, form-alert, text-field,
                   two-factor/{two-factor-step, code-input, resend-button, recovery-code-form},
                   forgot-password-form, reset-email-sent, reset-password-form
      hooks/       use-sign-in, use-sign-up, use-verify-code, use-verify-recovery-code,
                   use-send-email-code, use-request-reset, use-reset-password, use-cooldown
      lib/         schemas, auth-error, two-factor-methods, code-distribution, cooldown-store, name-from-email
      auth.content.ts
    companies/
      components/  company-card, company-background, status-badge, company-logo
      server/      companies.data.ts, get-companies.ts      # "server-only"
      lib/         company-schema.ts
      hooks/       use-companies.ts
      companies.content.ts
    email/
      components/  reset-password-email.tsx
      email.content.ts
  lib/ query-client.ts
public/brand/                            # Stolos logo exports (see ASSUME-9)
```

Files modified outside new ones: `package.json` (CLAR-3), `next.config.ts` (`withIntlayer`), `eslint.config.mjs` (ignore generated folders), `.gitignore`; **deleted** `src/app/layout.tsx` and `src/app/page.tsx` (multiple root layouts — see §7 F5; README invites replacing the start page). None is protected.

---

## 4. My technical decisions (TECH) — with trade-offs

| ID | Decision | Why / trade-off | Serves |
|---|---|---|---|
| TECH-1 | **i18n with Intlayer**: `[locale]` segment, `withIntlayer`, `intlayerProxy`, one `*.content.ts` per feature. | Recommended by PDF; removes the need for a switcher (REQ-4). | REQ-3, 4, 10 |
| TECH-2 | **2FA step stored in the URL** (`/login?step=verify&methods=totp,otp`, via `router.replace`, no reload). Sub-mode code/recovery in component state. | Survives reload (needed for REQ-15/16 on the email-only screen). `methods` isn't sensitive (proof = httpOnly 2FA cookie). Parsed with Zod; invalid → sign-in form. Alternative (pure state) loses the screen on reload. | REQ-13–16 |
| TECH-3 | **Auth calls = `authClient` wrapped in TanStack `useMutation`**; each hook converts Better-Auth's `{ data, error }` into a typed thrown `AuthError`; `X-Retry-After` read via `fetchOptions.onError`. | Uses the mandated stack; one place for loading/error state. | REQ-5, 23 |
| TECH-4 | **One pure error normalizer** → closed union (`invalidCredentials`, `emailTaken`, `invalidCode`, `twoFactorExpired`, `invalidToken`, `rateLimited(seconds)`, `unknown`), mapped to translated text. Raw server messages never shown. | Testable, no leaks (claude.md). | REQ-23 |
| TECH-5 | **Error placement**: credentials → alert above the button; email taken → under email field; invalid code → under boxes, boxes cleared + refocus; 429 → "retry in N s" with submit disabled; unknown → generic message. | Errors are not designed (REQ-24): my UX choice. | REQ-23, 24 |
| TECH-6 | **Cooldown mirrored client-side**: after a send, `availableAt = now + 30 s` in `localStorage` per action (`mfa-email-code`, `password-reset`); on 429, `availableAt = now + X-Retry-After`. `useCooldown` = `useSyncExternalStore` + 1 s tick. | Server stays the source of truth. Keyed per action (not per email) because Better-Auth rate-limits by IP + path. If storage is wiped, the next click gets a 429 and re-syncs. | REQ-15, 16 |
| TECH-7 | **Email-only auto-send** only if no cooldown is active; ref-guarded against Strict Mode double effects; a 429 there just sets the countdown. | Avoids a guaranteed 429 on reload; previous code stays valid 3 min. | REQ-14, 15 |
| TECH-8 | **Code input logic in a pure module** (`code-distribution.ts`); `inputMode="numeric"`, `autoComplete="one-time-code"`; paste strips non-digits; `onComplete` fires once; disabled while verifying. | Unit-testable, keeps the component thin. | REQ-17 |
| TECH-9 | **Zod schemas emit message keys** translated at render; RHF via `@hookform/resolvers/zod`. Confirm-password must match (Figma has the field; matching rule is mine). | Locale-agnostic schemas; server stays the authority. | REQ-5, 12 |
| TECH-10 | **Protected page guard on the server**: `auth.api.getSession({ headers })` in the server component → `redirect()`; behind `Suspense`/`connection()` because `cacheComponents` is on. `/login` redirects signed-in users to `/account`. | Cookie presence alone is not authorization. | REQ-22 |
| TECH-11 | **Check-inbox "Renvoyer le lien" after reload**: email kept in `sessionStorage`, not in the URL. If missing, resend goes back to the forgot-password form. | Keeps personal data out of history/logs. | REQ-15, 19 |
| TECH-12 | **Reset**: `redirectTo` includes the current locale; `?error=INVALID_TOKEN` handled on landing and `INVALID_TOKEN` on submit, both with a "request a new link" action; on success → sign-in with a success message. | Covers both failure points of REQ-20. | REQ-20 |
| TECH-13 | **Companies API**: `companies.data.ts` (server-only) `{ id, name, logo: { letter, color }, description: { fr, en }, sectors, status }`; route validates `locale` with Zod and returns the localized DTO; client `useQuery` (`staleTime: Infinity`) + Zod parse. Layer `aria-hidden`, `pointer-events-none`; on failure, no cards — auth never blocked. | Implements CLAR-4/8. | REQ-30–32 |
| TECH-14 | **Responsive background**: cards absolutely positioned in two side columns with `vw`/`vh` + `clamp()`, cropped at edges like Figma; auth card always on top, centre column never overlapped. | Verified by screenshots at both resolutions. | REQ-25 |
| TECH-15 | **`/email`**: server component rendering the designed template with the **latest real reset link** from `DevMail` (read-only); optional `?to=` and `?locale=`; empty state if none. | The PDF only says "visible at `/email`"; using the real link makes it usable end to end. Like `/code`, it's a dev helper exposing a live link. | REQ-21 |
| TECH-16 | **`TextField`** built on the provided `Input`, same visual contract as `PasswordInput`; provided components not modified. | Figma uses the same floating label for email / recovery fields. | REQ-2 |
| TECH-17 | **Name from email** as a pure, tested helper (`jane.doe@x.com` → `jane.doe`). | Implements CLAR-5. | REQ-12 |

---

## 5. Assumptions not yet confirmed (ASSUME)

| ID | Default I'll apply | Why it's needed |
|---|---|---|
| ASSUME-1 | Bare `/login` → `/fr/login` unless cookie / `Accept-Language` says `en`. | PDF requires `/login` but not its language. |
| ASSUME-2 | Every page under `/{locale}/…` except `/code`, `/email`, `/api`. | PDF gives the pattern for login only. |
| ASSUME-3 | `/email` defaults to French. | Email language not specified. |
| ASSUME-4 | Paste of fewer than 6 digits fills from the focused box; 6 digits always fill from box 1. | PDF only describes full-code paste. |
| ASSUME-5 | No "trust this device" option. | Not in Figma. |
| ASSUME-6 | `INVALID_TWO_FACTOR_COOKIE` → back to sign-in form, email prefilled, explanatory message. | Behaviour not specified. |
| ASSUME-7 | Signed-in page = `/{locale}/account` in the same shell: "Vous êtes connecté·e" + name/email + sign out. | PDF: "any page". |
| ~~ASSUME-8~~ | Resolved by step 0 finding F1/F2: every unlisted code now has a specific message. | — |
| ASSUME-9 | 3D Stolos logo and email logo: placeholder until you export them to `public/brand/`, swapped at the fidelity pass. | Assets not in the repo. |
| ASSUME-10 | "Conditions d'utilisation" / "Politique de confidentialité" link to `#`. | No target pages; building them would be an unrelated feature. |
| ASSUME-11 | ~8 companies with varied names, sectors and statuses. | Figma repeats Doctolib as a placeholder. |
| ASSUME-12 | `auth_PLAN.md` and `claude.md` stay uncommitted until you say otherwise. | Commit policy. |

---

## 6. Testing strategy (claude.md: strict TDD)

Red → green → refactor; each step lands with its tests. The **REQ** column ties tests back to explicit requirements so coverage is auditable.

| Layer | Tooling | What | REQ |
|---|---|---|---|
| Unit | Vitest | `code-distribution` (type, backspace, arrows, paste 6 / <6 / with spaces & dashes, any focus) | 17 |
| Unit | Vitest | `auth-error` (every README code, 429 + header, unknown) | 23 |
| Unit | Vitest | `two-factor-methods` (parse, view model per combination) | 14 |
| Unit | Vitest | `cooldown-store` (fake clock, 429 override, corrupted storage) | 15, 16 |
| Unit | Vitest | schemas (email, password ≥ 8, confirm), `name-from-email`, company DTO + locale | 12, 31 |
| Component | Testing Library + user-event (jsdom); `authClient` mocked **in tests only** | tabs switch without navigation; sign-in errors; 2FA view per methods; email-only auto-send once, not during cooldown; countdown with fake timers and after remount; recovery toggle and back; forgot → confirmation → resend cooldown; reset `?error` and submit `INVALID_TOKEN`; card badge per status | 11, 13–20, 23, 32 |
| Route | Vitest | `/api/companies` per locale; invalid locale → 400 | 31 |
| E2E | Playwright, real seeded DB (`bun run db:seed`), codes read via Prisma helper | 4 test accounts; sign-up; forgot → `/code` → reset → sign in; reused link → error; `/account` unauthenticated → redirect; `/fr` vs `/en`; `/email`; screenshots 1920×1080 & 1400×900 | 10–25 |

Final gate: `vitest run`, `tsc --noEmit`, `bun run lint`, `bun run build`, Playwright, manual pass at both resolutions, each REQ checked off in the final report.

---

## 7. Step 0 findings (done — affects TECH items above)

Facts verified in the installed sources; they refine decisions without changing any REQ or CLAR.

| # | Finding | Source | Impact |
|---|---|---|---|
| F1 | Better-Auth returns **error codes not listed in the README**: `INVALID_BACKUP_CODE` (401, wrong recovery code), `OTP_HAS_EXPIRED` (400, no pending/expired email code), `TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE` (400), `ACCOUNT_TEMPORARILY_LOCKED` (429, after 10 consecutive failures, 15 min, from the lockout — **no `X-Retry-After`**). | `better-auth/dist/plugins/two-factor/*` | TECH-4 union extended: `invalidRecoveryCode`, `emailCodeExpired`, `tooManyCodeAttempts`, `accountLocked`. Resolves ASSUME-8. |
| F2 | Attempt limits: **5 wrong codes per email code** (then request a new code; sign-in still valid); **5 wrong app/recovery codes per sign-in attempt**, after which the 2FA cookie is deleted → user must **sign in again**. | `otp/index.mjs`, `totp/index.mjs`, `verify-two-factor.mjs` | `TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE` handled per factor: email → "request a new code"; app/recovery → back to sign-in form (like `INVALID_TWO_FACTOR_COOKIE`). |
| F3 | CLAR-6 fallback detail: `verifyOtp` returns `OTP_HAS_EXPIRED` (not `INVALID_CODE`) when the email code expired. A wrong code in the fallback counts as **one OTP failure + one app failure + two account failures** (lockout at 10). | same | Fallback to `verifyTotp` on `INVALID_CODE` **and** `OTP_HAS_EXPIRED`. The trade-off you accepted is now quantified: ~5 wrong codes in "app + email" mode trigger the 15-min account lock. |
| F4 | Invalid/expired reset link → redirect to `callbackURL?error=INVALID_TOKEN`; links last **3600 s** (matches the email's "expire dans une heure"). | `api/routes/password.mjs` | Confirms TECH-12. |
| F5 | Next 16: `/code` and `/email` must stay outside `/{locale}`, but a root layout must render `<html>`/`<body>`. Next supports **multiple root layouts when `app/layout.tsx` is omitted**. | `docs/.../layout.md` | §3 change: **delete `src/app/layout.tsx` and `src/app/page.tsx`**; root layouts become `app/[locale]/layout.tsx` (with `lang`), **new** `app/code/layout.tsx` (so `code/page.tsx` stays untouched) and `app/email/layout.tsx`, sharing one `<html>` shell component. Bare `/` is redirected by the proxy. |
| F6 | With `cacheComponents`, reading the session (`headers()`/`cookies()`) **must sit inside `<Suspense>`** (build error otherwise); routes navigated away from stay mounted (hidden) via React `<Activity>`, so effects re-run when shown again. | `docs/.../authentication-with-cache-components.md`, `cacheComponents.md` | TECH-10 confirmed; auto-send (TECH-7) and countdown effects must be safe to re-run — the cooldown check already makes them idempotent. |
| F7 | Intlayer 9: `IntlayerProvider` from `next-intlayer/server` in the locale layout, `useIntlayer(key)` in server and client components, `getIntlayer(key, locale)` outside components, `intlayerProxy` from `next-intlayer/proxy`, `routing.mode: "prefix-all"`. | `next-intlayer/dist/types` | TECH-1 confirmed, `intlayer.config.ts` uses `prefix-all`, default `fr` (ASSUME-1). |
| F8 | `glassmorphism`'s `var(--blur-md)` resolves: Tailwind emits `--blur-md: 12px`. | built CSS | No change to `globals.css`. |
| F9 | Bun blocked install scripts for `prisma`, `@prisma/engines`, `esbuild`, `@parcel/watcher`; everything works without them (prebuilt binaries). | `bun pm untrusted` | Not trusted — nothing to do. |

Step 0 tooling: `intlayer.config.ts`, `next.config.ts` (`withIntlayer`), `vitest.config.mts` + `vitest.setup.ts`, `playwright.config.ts` (single 1920×1080 project, serial, because flows share server rate limits; responsive spec sets both viewports itself), scripts `typecheck` / `test` / `test:watch` / `test:e2e`, `.gitignore` + ESLint ignores for `.intlayer/`, Playwright output. `@testing-library/dom` added (required peer of `@testing-library/react`).

### Step 1 notes (done)

Pure modules in `src/features/auth/lib/` (each with its test file): `auth-error`, `two-factor-methods`, `code-distribution`, `cooldown-store`, `schemas`, `name-from-email`. Decisions taken while implementing (all **TECH**):

- **Fallback also on `tooManyCodeAttempts`** (CLAR-6 implementation detail): after 5 wrong tries the email code is dead, but the user may be typing app codes; stopping there would block a valid app code. Verifier order stays `otp → totp`.
- **Recovery code** accepted with or without the dash, trimmed; the dash is re-inserted before sending (server compares `xxxxx-xxxxx` exactly, case-sensitive).
- **Password rules** 8–128 = Better-Auth defaults (README states the minimum). Sign-in only checks "not empty".
- **Cooldown duration is not duplicated** on the client: `start(action, seconds)` takes it as an argument; the value will come from `RESEND_COOLDOWN_SECONDS` (server, read-only import) through a server component, or from `X-Retry-After`. Stored deadlines are capped at 1 h and fall back to memory if storage is blocked.
- Mutation check: deliberately breaking the paste logic made 5 tests fail; a `when` option I had added to the Zod refine turned out to change nothing (Zod 4 already skips the match check after a "required" failure) — removed as unnecessary complexity, behaviour pinned by tests.

### Step 2 notes (done)

`src/features/auth/components/`: `TextField`, `CodeInput`, `ResendButton`; `hooks/use-cooldown.ts`; `lib/browser-cooldown-store.ts` (one store per page). All texts come in as props (translated by callers), like the provided `PasswordInput`. Decisions (**TECH**):

- **`TextField`** repeats `PasswordInput`'s classes instead of sharing them: `PasswordInput` is provided code I don't modify.
- **`CodeInput`** keeps its digits internally; the parent clears it by remounting with a new `key` (e.g. after `INVALID_CODE`). `onComplete` fires from the event handler (not an effect) each time the boxes hold a *new* complete code, so correcting one digit re-submits. Content is selected on focus so typing replaces the digit. `autoComplete="one-time-code"` on the first box for OS autofill.
- **`useCooldown`** = `useSyncExternalStore` + 1 s tick; server snapshot is `0`, the real value appears after hydration. Re-renders only when the number of seconds changes.
- **`ResendButton`** only displays and disables; the caller starts the cooldown from the server's answer (success → 30 s, 429 → `X-Retry-After`).
- Test tooling: Vitest 5 fakes `setTimeout` by default, which hangs Testing Library's async wrapper; countdown tests fake only `Date`, `setInterval`, `clearInterval`.

---

## 8. Implementation order (after approval)

0. Install CLAR-3 deps; read Next 16 docs; Intlayer, Vitest, Playwright setup; smoke test; check `--blur-md` used by `glassmorphism` actually resolves (report only, `globals.css` not edited without asking).
1. Pure libs (TDD): error normalizer, schemas, methods parser, code distribution, cooldown store, name-from-email.
2. `CodeInput`, `TextField`, `ResendButton` + `useCooldown`.
3. `[locale]` layout, proxy, providers, auth shell.
4. Sign-in / sign-up → account page + guard + sign-out.
5. 2FA step (3 cases, resend, recovery).
6. Forgot / reset password + `/email`.
7. Companies endpoint + background cards + translations.
8. Figma fidelity, responsive, a11y.
9. E2E, final quality gate, final report.
