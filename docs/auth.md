# EPIC 0 — Authentication

**Goal:** Public Vercel URL ko lock karo, aur har session ke saath ek stable user identity ho.

**Yeh epic kya nahi hai:** cloud sync, Firestore, multi-user product, password accounts.

**Kyun pehle:** `https://tathastu-ten.vercel.app` ab bina gate ke khula hai. Progress abhi bhi is device ke `localStorage` mein rahega. Auth sirf **kaun app use kar sakta hai** decide kare. Data move baad mein.

**v1 method:** Google sign-in. Ek allowlisted email (owner). Email/password, magic link, anonymous auth — out of scope.

**Rule:** Existing Today / Diet / Health flows rebuild nahi. Unprotected sirf `/login`. Baaki routes signed-in owner ke bina nahi khulni.

---

### US-A01 — Sign in with Google

**As a user,**
I want to sign in with my Google account,
**so that Tathastu knows who I am without a new password.**

**Acceptance Criteria**

- `/login` pe ek clear action: “Continue with Google”.
- Success ke baad Today (`/`) khule.
- Allowlisted owner email ke liye sign-in succeed ho.
- Non-allowlisted Google account sign-in ke baad app use na kar sake; error dikhe, session establish na ho (ya turant revoke).
- Sign-in fail (popup closed, network) pe app crash na kare; login page pe retry ho.

---

### US-A02 — Stay signed in

**As a user,**
I want to remain signed in across refresh and new tabs on the same browser,
**so that I don’t sign in every time I open Tathastu.**

**Acceptance Criteria**

- Refresh ke baad session rehydrate ho, `/login` pe bounce na ho.
- Same browser ke do tabs same signed-in user dekhein.
- Browser band karke wapas aane par session valid rahe jab tak provider session valid hai.
- Session restore hone tak protected page flash of Today-without-auth na dikhe (loading / gate).

---

### US-A03 — Protect the app

**As a user,**
I want Today, Diet, Health, and Workout to be available only after I sign in,
**so that a stranger with the live URL cannot use my tracker.**

**Acceptance Criteria**

- Unauthenticated visit to `/`, `/diet`, `/health`, `/health/workout` → `/login` (original path remember ho).
- Sign-in ke baad wahi intended path khule (`/diet?meal=diet_lunch` query preserve).
- Unauthenticated user ko schedule/diet/health data render na ho.
- Bottom nav login page pe na dikhe.

---

### US-A04 — Sign out

**As a user,**
I want to sign out,
**so that this browser session stops acting as me.**

**Acceptance Criteria**

- Signed-in UI se Sign out available ho (header / account).
- Sign out ke baad `/login` khule.
- Protected routes phir se inaccessible.
- Sign out **localStorage progress delete na kare** (same phone/laptop pe data rahe).
- Sign out ke baad Google account picker dubara aa sake.

---

### US-A05 — See who is signed in

**As a user,**
I want to see which account is active,
**so that I know the session is mine.**

**Acceptance Criteria**

- Signed-in shell pe email (ya display name) dikhe.
- Identity session se aaye, hard-coded “Ashish” se nahi.

---

### US-A06 — Auth failure is visible

**As a user,**
I want a clear message when sign-in is denied or broken,
**so that I know whether to retry or stop.**

**Acceptance Criteria**

- Allowlist miss: “This account is not allowed to use Tathastu.”
- Network / provider error: retryable message, silent fail nahi.
- Logged-out deep link: login ke baad wapas us route pe.

---

### US-A07 — Existing local data survives

**As a user,**
I want my current Done/Missed, meals, workout, and reflection to remain after I turn auth on,
**so that adding login does not reset this device.**

**Acceptance Criteria**

- Pehle se saved `schedule-status-*`, `meal_status`, `workout_progress`, `meditation_progress`, `daily_reflection` wipe na hon.
- Pehla successful owner sign-in usi device ke existing keys use kare.
- Auth keys / session tokens alag hon; progress keys overwrite na hon.
- Is unke baad bhi progress **isi browser** tak limited hai. Doosre device pe data copy nahi hoga — yeh sync nahi hai, expected.

---

## Out of scope (is epic mein nahi)

| Idea | Why later |
|---|---|
| Email / password | Reset, verification, extra UI. Google kaafi. |
| Sign-up / onboarding | Personal app. Allowlist = access. |
| Anonymous auth | Public URL pe guest session bekaar. |
| Firestore / cloud sync | Alag epic. Auth sirf uid deta hai. |
| User-scoped localStorage keys | Ek owner, ek device. Tab jab doosra account real ho. |
| Roles / admin | Ek allowlisted user. |
| Auth for Diet/Health APIs | Koi server API nahi. |

---

## Implementation notes (stories nahi, constraints)

- Client-only Next.js + Vercel. Auth provider session browser mein.
- Allowlist env se (`OWNER_EMAIL` / equivalent), source mein email hard-code mat karo.
- `/login` public. Baaki app gated.
- Firebase Auth acceptable v1; stories provider-agnostic hain.
- Auth ke baad bhi repositories localStorage pe. `uid` wire tab jab sync epic aaye.

---

## First slice

1. US-A01 + US-A03 — Google sign-in + route gate  
2. US-A02 — persist session  
3. US-A04 + US-A05 — sign out + who is signed in  
4. US-A06 + US-A07 — errors + data wipe nahi  

Uske baad rukna. Sync mat chipkana.
