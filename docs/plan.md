# Tathastu — Plan

**Product:** Personal execution system. Planning alag, execution alag.

**Stack constraint:** Next.js web app (Vercel). Ek user. Progress localStorage mein. PWA / push / Firebase **sync** abhi nahi. Auth alag hai — dekh `docs/auth.md`.

**Rule:** Jo already kaam karta hai, usko rebuild mat karo. Naya kaam existing repository layer pe baithna chahiye — UI se seedha localStorage nahi.

---

## Current app (already shipped)

- Today: time blocks, Active / Upcoming / Delayed / Completed
- Done / Missed (future blocks Done nahi ho sakte)
- Weighted **Completion** score (`core` / `growth` / `support`; `ignore` count nahi)
- Delayed block baad mein Done ho sakta hai
- Diet + Health tracking
- End-of-day reflection (abhi UI localStorage leak hai)

**Status aaj:** `done | missed`. Timestamp nahi. Delayed clock se derive hota hai, stored state nahi.

---

## Scores (formulas pehle, UI baad mein)

Sirf **do** daily numbers. Teesra (`Integrity`) tab tak nahi jab tak self-report ke alawa evidence na ho.

### Completion (already exists)

```text
eligible = blocks where category != ignore
Completion = sum(weight of Done) / sum(weight of eligible)
```

Late Done bhi full Completion deta hai. Missed aur pending = 0.

### Discipline (new)

Needs `completedAt`.

```text
For each eligible block with weight W:
  pending or missed          → 0
  Done and completedAt in [start, end] → W
  Done after end (same day)  → W * 0.5

Discipline = sum / sum(eligible weights)
```

Overnight window (`end <= start`, e.g. Sleep 00:30–08:00): wrap around midnight.

**Integrity:** not a daily score. Later, 7-day average of Discipline — ya screen-time evidence ke baad naya metric.

**Day rating** existing thresholds Completion pe hi rahengi, jab tak Discipline alag dikhe.

---

## Status model

```text
stored:   pending (absent) | done | missed
derived:  upcoming | active | delayed | completed
```

| User action | Completion | Discipline |
|---|---|---|
| Done inside window | full | full |
| Done after window (same day) | full | half |
| Explicit Missed | 0 | 0 |
| Pending after end (Delayed) | 0 until Done/Missed | 0 until Done/Missed |

- Delayed **rebuild nahi** — already UI section hai.
- Missed = conscious skip. End of day auto-miss nahi.
- Undo v1 mein nahi. Done/Missed sticky for that date.
- `completedAt` / `missedAt` ISO timestamps, repository se.

---

## Implementation order

```text
CURRENT APP
    ↓
EPIC 0 — Authentication (docs/auth.md) — identity + live URL gate, no sync
    ↓
EPIC 1 — Execution truth (timestamps + discipline)
    ↓
EPIC 2 — Tomorrow lock (thin)
    ↓
EPIC 3 — In-app attention (tab open)
    ↓
EPIC 4 — Consistency history
    ↓
STOP. Next yahan se sochna, abhi banana nahi.
```

---

# EPIC 1 — Execution truth

**Goal:** Har Done/Missed ke saath time save ho, aur Today pe Discipline dikhe.

**Out of scope:** notifications, plan editor, Firebase, Integrity, history charts.

### US-01 — Completion timestamp

**As a user,** I want Tathastu to record the exact time I mark a task Done or Missed, **so that on-time vs late can be measured.**

**Acceptance Criteria**

- `done` writes `completedAt` (local clock, ISO).
- `missed` writes `missedAt`.
- Future blocks still cannot be marked Done/Missed.
- Timestamp repository ke through persist ho, UI se localStorage nahi.
- Refresh ke baad timestamp rehte hain.
- Ignore blocks timestamp store kar sakte hain, score mein nahi aate.

### US-02 — Discipline score

**As a user,** I want a Discipline score separate from Completion, **so that I can see whether I followed planned timing.**

**Acceptance Criteria**

- Formula upar wali Discipline definition follow kare.
- Today header: `Completion: x / y` ke saath `Discipline: a / b` (ya percent).
- Late Done = Completion full, Discipline half.
- Pending delayed task dono scores mein 0.
- Ignore blocks dono scores se bahar.

### US-03 — Reflection via repository

**As a user,** I want my end-of-day note saved with that day's scores, **so that reflection the same path use kare jitna baaki progress.**

**Acceptance Criteria**

- `daily_reflection` UI se nikal ke schedule/reflection repository mein aaye.
- Save: completion, discipline, rating, note, date.
- Existing same-day note load ho.

---

# EPIC 2 — Tomorrow lock (thin)

**Goal:** Execution se pehle plan confirm ho. Full editor nahi — weekly template ka snapshot lock.

**Out of scope:** drag-drop, custom times, adding arbitrary blocks, unlocking midday.

Weekend pehle se THINKING mode hai — usko planning night banao, har din naya editor nahi.

### US-04 — Confirm tomorrow

**As a user,** I want to confirm tomorrow's schedule from my weekly template, **so that next day execution ek committed plan pe chale.**

**Acceptance Criteria**

- After 22:00, Today pe "Confirm tomorrow" dikhe.
- Preview: tomorrow ke template blocks (title + time + mode).
- Confirm = us date ke liye snapshot lock.
- Confirm ke bina next day weekly template pe fallback (din block nahi hota).
- v1 mein edit nahi — confirm or skip. Skip = fallback.

### US-05 — Load locked plan

**As a user,** I want the new day to load my locked plan automatically, **so that I enter execution without deciding the schedule.**

**Acceptance Criteria**

- Agar date ke liye locked snapshot hai, Today wahi load kare, live JSON template nahi.
- Snapshot immutability: execution day par blocks add/remove/retune nahi.
- Status/progress snapshot se alag store ho (existing date-keyed maps).

---

# EPIC 3 — In-app attention

**Goal:** Tab open ho toh Tathastu remind kare. Closed-tab push nahi.

**Out of scope:** service worker, Web Push, iOS home-screen PWA, SMS, email.

Existing 60s tick use karo. Browser `Notification` sirf permission ke baad, extra reliability ke liye nahi.

### US-06 — Permission

**As a user,** I want a clear, one-time notification permission request, **so that I can allow reminders without being spammed.**

**Acceptance Criteria**

- Prompt ek baar, user action ke baad (button), page-load pe nahi.
- Denied: app normal, in-app banner still kaam kare, native notification nahi.
- Permission state UI mein dikhe (`on` / `blocked` / `not asked`).

### US-07 — Task start reminder

**As a user,** I want to be reminded when a task becomes active, **so that I start it on time.**

**Acceptance Criteria**

- Trigger: current time enters `[start, end)` and block not done/missed.
- Payload: task title.
- `ignore` category skip.
- Same `taskId + date + start` ek baar.
- Sent log persist (repository).
- Native notification sirf permission granted ho.

### US-08 — Ending-soon reminder

**As a user,** I want a reminder 5 minutes before an active task ends, **so that I can still finish inside the window.**

**Acceptance Criteria**

- Default: `end - 5 min`.
- Skip if already done/missed.
- Skip if block duration `<= 10 min` (short tasks pe 3 pings nahi).
- Skip `ignore`.
- Payload: title + remaining minutes.
- Dedup: `taskId + date + ending`.

### US-09 — Delayed reminder

**As a user,** I want one reminder when a task becomes delayed, **so that I decide to finish it later or skip it.**

**Acceptance Criteria**

- Trigger: time `>= end`, not done/missed, not ignore.
- Delayed section already exists — sirf ek ping, naya UI state nahi.
- Dedup: `taskId + date + delayed`.
- User uske baad Done (late) ya Missed kar sake — already true.

**Anti-spam:** ek block ke liye max 3 events (start, ending, delayed), aur short blocks pe ending skip.

---

# EPIC 4 — Consistency history

**Goal:** Ek bure din se pattern na judge ho. Naya Goal entity nahi.

**Out of scope:** streaks gamification, long-term goal graph, AI commentary.

### US-10 — Week history

**As a user,** I want this week's Completion and Discipline per day, **so that I see the pattern, not only today.**

**Acceptance Criteria**

- Last 7 dates, dono scores.
- Data existing per-day maps se; alag analytics store nahi.
- Missing day = empty, 0 se fake-fill nahi.

### US-11 — Daily consistency flag

**As a user,** I want a simple yes/no for whether the day was followed, **so that history skimmable ho.**

**Acceptance Criteria**

```text
consistent = Completion >= 0.7 AND Discipline >= 0.5
```

- Flag derived, stored alag se nahi (recompute from timestamps).
- Week view pe dikhe.

---

## Explicitly later (is plan ka hissa nahi)

Mat mix karo current epics ke saath:

| Idea | Why later |
|---|---|
| Web Push / PWA / iOS notifications | Platform project. Tab-closed delivery web pe unreliable. |
| Firebase sync | Ek device pe localStorage kaafi. Auth + rules alag epic. |
| Schedule editor (custom blocks/times) | Lock pehle, editor baad mein. |
| Integrity daily score | Discipline ka duplicate jab tak actual activity na ho. |
| Screen-time upload | Web Screen Time read nahi kar sakta. Screenshot+AI fragile. |
| Deviation engine | Bina duration evidence ke wahi Discipline hai. |
| AI daily insight | Facts pehle stable hone chahiye. |
| Goal entity | Weights/categories already hain. History pehle. |
| Undo Done/Missed | Discipline ko gameable bana deta hai v1 mein. |

Prep jo Firebase se pehle sasta hai: **saara progress repository se** (Epic 1, US-03). Adapter swap baad mein.

---

## First vertical slice

Epic 1 poora, uske baad ruko aur Today use karo 3–4 din:

1. `completedAt` / `missedAt` on schedule status
2. Discipline formula + header
3. Reflection repository move

Uske baad Epic 2 ya Epic 3 — dono Epic 1 pe depend karte hain, ek doosre pe nahi. Prefer **Epic 2 pehle** agar notifications template pe nahi, locked plan pe chahiye.
