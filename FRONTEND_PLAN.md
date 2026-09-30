# ResourceHub — Frontend Plan (Agent Task Checklist)

This file **replaces the client tasks** in `RESOURCEHUB_PLAN.md`: 2.6, 2.7, 3.4, 3.5, 4.7, 4.8, 4.9, 4.10, and 5.4. Skip those in the main file and use the tasks here instead. Backend tasks and Task 0.6 (client bootstrap) from the main file stay as they are.

Every task below says which **backend task must be finished first**. Don't start a frontend task before its backend dependency is done and reviewed.

---

## How the agent must work

Same rules as the main plan:

1. Exactly **one task at a time**; the human names it (example: "Do Task F1.2 only").
2. Post a **short plan** (files to create or change) and wait for approval before coding.
3. Tick checkboxes in this file as items complete.
4. When done: summarize what changed, how to run and verify it, and anything uncertain.
5. **Stop at the 🛑 Review gate.** Don't start the next task. Don't commit; the human commits.
6. Don't touch unrelated files. Don't add dependencies without asking. **Don't modify the backend**; if a frontend task needs a backend change, stop and report it.

Review depth tags: 🟢 quick look, 🟡 read the diff, 🔴 line by line.

---

## Frontend rules (always apply)

**Stack:** React + Vite (JavaScript), React Router, TanStack Query, React Hook Form + Zod, Tailwind CSS + shadcn/ui, lucide-react icons, sonner for toasts, the **same date library the backend uses** for timezone work, a calendar library (FullCalendar or react-big-calendar; ask before installing). Tests: Vitest + React Testing Library, Playwright for end-to-end.

**Structure (feature-based):**
- `src/features/<auth|resources|reservations|team>/` each with `api/`, `hooks/`, `components/`, `pages/`
- `src/components/ui/` shared shadcn components
- `src/components/` shared app components (EmptyState, ErrorState, ConfirmDialog, etc.)
- `src/layouts/`, `src/lib/` (api client, query client, date utils, error messages), `src/routes/`

**Rules:**
1. Components never call `fetch` directly. They use feature hooks, which use `src/lib/api`.
2. Server data lives in TanStack Query. Local UI state uses `useState`. The only global context is auth. No Redux.
3. Query keys are arrays that include **every parameter** the data depends on (resource ID, date range, page, filters).
4. The auth token never touches JavaScript-accessible storage. Cookies only.
5. Permission checks in the UI (hiding buttons, role gates) are **cosmetic**. The backend is the real enforcement.
6. All times from the API are UTC ISO strings. Display and input go through the date utilities in the **organization's timezone**. Never use raw `Date` string formatting for user-facing times.
7. Every screen that loads data has a loading state, an empty state, and an error state with retry.
8. Every form uses React Hook Form + Zod, disables submit while pending, and maps server field errors onto the right inputs.
9. Server error `code` values map to human-friendly messages in **one file** (`src/lib/errorMessages.js`).
10. Accessible by default: labeled inputs, keyboard operable, focus managed in dialogs, state never conveyed by color alone.
11. Mobile first, responsive down to 360px.
12. Small components (aim under ~150 lines), no inline styles, no copy-pasted blocks.

### Decision for the human before F3.2

Should regular members see **who** booked a slot, or only that it's booked? Default plan: members see "Booked" (their own reservations highlighted and labeled "You"), admins see names. Showing names to admins needs the resource-reservations endpoint (Task 4.6) to include the booker's name for admins only. If you want that, make the backend change first.

---

# Phase F0 — Frontend foundations
*(after backend Task 0.6)*

### Task F0.1 — Structure and tooling 🟢
- [x] Create the folder structure above (empty folders can hold a `.gitkeep`)
- [x] Path alias `@` pointing at `src/`
- [x] ESLint + Prettier configured, scripts `lint` and `format`
- [x] Remove the temporary health-check page

**Done when:** `npm run lint` passes and the app still runs.
**🛑 Review:** folder layout matches the rules.
**Commit:** `Organize client into feature folders with linting and formatting`

### Task F0.2 — Tailwind and shadcn/ui 🟢
- [x] Install and configure Tailwind following current official docs
- [x] Initialize shadcn/ui (JavaScript, not TypeScript)
- [x] Define the theme (colors, radius, fonts) through CSS variables; pick a calm, professional palette and state which one you chose

**Done when:** a test page renders a styled shadcn Button.
**🛑 Review:** colors are defined as theme tokens, not hardcoded hex values in components.
**Commit:** `Add Tailwind and shadcn/ui with theme tokens`

### Task F0.3 — Base components 🟡
- [x] Add shadcn components: button, input, label, textarea, select, card, dialog, alert-dialog, badge, table, skeleton, tabs, dropdown-menu, sonner (toaster)
- [x] Dev-only route `/_ui` that shows every component in its states (default, disabled, loading) for visual checking
- [x] Remove or hide `/_ui` in production builds

**Done when:** `/_ui` shows everything and looks consistent.
**🛑 Review:** open `/_ui` and check it at mobile width.
**Commit:** `Add base UI component set with dev showcase page`

### Task F0.4 — App shell and routing 🟡
- [x] Route table in one file (`src/routes/`) using React Router
- [x] `PublicLayout` (centered card, for login and register) and `AppLayout` (header with app name, nav links, user menu, mobile navigation)
- [x] 404 page and a top-level error boundary with a friendly fallback
- [x] Placeholder pages for every planned screen so nav works

**Done when:** you can click through every nav link and a bad URL shows the 404 page.
**🛑 Review:** the layout works at 360px, with a usable mobile menu.
**Commit:** `Add app shell, layouts, route table, and error boundary`

### Task F0.5 — API layer and query defaults 🟡
- [x] Error normalization: every failed request throws `{ status, code, message, fields }` using the backend's error shape; network failures produce a clear "can't reach the server" error
- [x] `QueryClient` defaults: don't retry on 4xx, sensible stale time, no refetch storms
- [x] Global handling: a 401 from any non-auth endpoint clears auth state and redirects to login, remembering where the user was
- [x] `src/lib/errorMessages.js`: map of error codes to friendly text, with a fallback message

**Done when:** a manually triggered 401 sends you to login.
**🛑 Review:** non-auth 401s trigger the redirect, but a wrong-password 401 on the login form does not.
**Commit:** `Add normalized API errors, query defaults, and session-expiry handling`

### Task F0.6 — Shared state components 🟢
- [x] `LoadingState` (skeletons), `EmptyState` (icon, message, optional action), `ErrorState` (message plus retry button), `PageHeader` (title, description, actions), `ConfirmDialog` (reusable, async-aware), `Pagination` control
- [x] Each shown on `/_ui`

**Done when:** all are visible and reusable with props.
**🛑 Review:** `ConfirmDialog` disables its buttons while the action is pending.
**Commit:** `Add shared loading, empty, error, confirm, and pagination components`

### Task F0.7 — Form kit 🟡
- [x] `FormField` wrapper tying label, input, description, and error message together accessibly (works with React Hook Form)
- [x] Helper that applies the API error's `fields` to the form via `setError`, and shows a general message for non-field errors
- [x] A demo form on `/_ui` proving both client-side Zod errors and simulated server errors render under the right fields

**Done when:** the demo form shows both kinds of errors correctly.
**🛑 Review:** error text is linked to the input for screen readers.
**Commit:** `Add accessible form field wrapper and server-error mapping`

### Task F0.8 — Date and timezone utilities 🔴
- [x] `src/lib/dates.js`: format a UTC ISO string in a given IANA timezone (date, time, range), convert a local date and time in the org timezone to a UTC ISO string, compute week start and end in a timezone
- [x] Use the same library the backend uses
- [x] Unit tests with fixed dates, including a daylight-saving boundary and an org timezone different from the browser's

**Done when:** tests pass, including DST and the mismatched-timezone case.
**🛑 Review:** no manual offset arithmetic; a library does every conversion.
**Commit:** `Add timezone-aware date utilities with tests`

---

# Phase F1 — Auth screens
*(after backend Tasks 2.2 to 2.4)*

### Task F1.1 — Auth context and hooks 🔴
- [ ] `AuthProvider`: calls `/auth/me` on load, exposes `user`, `organization`, `isLoading`, and `login`, `register`, `logout` actions
- [ ] **On login, register, and logout: clear the entire TanStack Query cache** so one account's data can never appear for another
- [ ] Nothing auth-related stored in localStorage or sessionStorage

**Done when:** log in as org A, log out, log in as org B: no org A data flashes or persists.
**🛑 Review:** test the org A to org B switch by hand and watch the network tab.
**Commit:** `Add auth provider that clears cached data on session changes`

### Task F1.2 — Login page 🟡
- [ ] Form (email, password) with the form kit; submit pending state
- [ ] Generic error on bad credentials (don't say which field was wrong)
- [ ] Redirect to the page the user originally wanted, or the home page

**Done when:** seeded credentials log you in, bad ones show the generic error.
**🛑 Review:** refresh after login: still logged in.
**Commit:** `Add login page`

### Task F1.3 — Register page 🟡
- [ ] Form: organization name, your name, email, password (with strength hint)
- [ ] Field errors for duplicate email and weak password mapped from the server
- [ ] Link between login and register pages

**Done when:** a brand-new organization registers and lands in the app as admin.
**🛑 Review:** duplicate email error shows under the email field.
**Commit:** `Add registration page`

### Task F1.4 — Route protection 🟡
- [ ] `ProtectedRoute` (redirects unauthenticated users to login, remembers the target)
- [ ] `RoleGate` component for hiding admin-only UI and a guard for admin-only routes (shows a "no access" page)
- [ ] Logged-in users visiting login or register get redirected home

**Done when:** every combination (logged out, member, admin) behaves correctly.
**🛑 Review:** open an admin URL as a member: you see "no access." Remember this is cosmetic; the backend still returns 403.
**Commit:** `Add protected routes and role-based UI gating`

### Task F1.5 — Team page 🟡
*(after backend Task 2.5)*
- [ ] Admin-only page with a table of org users (name, email, role) and pagination
- [ ] "Add member" dialog (name, email, temporary password) using the form kit
- [ ] Nav link visible to admins only

**Done when:** an admin adds a member and sees them in the list.
**🛑 Review:** log in as the new member to verify the account works and sees no admin UI.
**Commit:** `Add admin team management page`

---

# Phase F2 — Resources screens
*(after backend Tasks 3.1 and 3.2)*

### Task F2.1 — Resource list 🟡
- [ ] Responsive card grid: name, type, active badge
- [ ] Type filter and pagination stored in **URL search params** (so refresh and back/forward work)
- [ ] Admins get a toggle to include inactive resources
- [ ] Skeleton loading, empty state, error state with retry

**Done when:** filters and pages survive a refresh and the back button.
**🛑 Review:** log in as each seeded org and confirm each only sees its own resources.
**Commit:** `Add resource list with URL-based filters and pagination`

### Task F2.2 — Resource detail shell 🟢
- [ ] Detail page: header with name, type, description, status badge
- [ ] Tabs: "Schedule" (placeholder for now) and "Details"
- [ ] 404-style state when the resource doesn't exist or belongs to another org

**Done when:** opening another org's resource ID shows the not-found state.
**🛑 Review:** paste an org B resource ID while logged in as org A.
**Commit:** `Add resource detail page shell`

### Task F2.3 — Admin: create and edit resource 🟡
- [ ] Create and edit form (dialog or page; pick one and use it consistently): name, type, description
- [ ] Duplicate name error mapped to the name field
- [ ] List and detail refresh after saving; success toast

**Done when:** an admin can create and edit; a member sees no such controls.
**🛑 Review:** try creating a duplicate name and see the field error.
**Commit:** `Add admin resource create and edit forms`

### Task F2.4 — Admin: deactivate and reactivate 🟡
- [ ] Deactivate and reactivate actions using `ConfirmDialog`, with a message explaining existing reservations stay on record
- [ ] Inactive resources show a clear badge (admins only see them)
- [ ] Success and error toasts

**Done when:** deactivating hides the resource from a member's list immediately after refetch.
**🛑 Review:** verify with a member login in another browser profile.
**Commit:** `Add resource deactivate and reactivate actions`

---

# Phase F3 — Reservation screens
*(after backend Tasks 4.3 to 4.6; make the names-for-admins decision above first)*

### Task F3.1 — Reservation data layer 🟢
- [ ] API functions and hooks: resource reservations by date range, my reservations, admin reservations, create, cancel
- [ ] Mutations invalidate exactly the queries they affect (resource calendar range, my reservations)
- [ ] Errors keep the server `code` so the UI can react to `SLOT_TAKEN`

**Done when:** hooks work (verify with temporary logging, then remove it).
**🛑 Review:** query keys include resource ID and date range.
**Commit:** `Add reservation API functions and query hooks`

### Task F3.2 — Read-only calendar 🟡
- [ ] Ask which calendar library before installing
- [ ] Week view on the resource's Schedule tab showing confirmed reservations
- [ ] Everything displays in the **organization's timezone**
- [ ] Your own reservations visually distinct and labeled "You"; others labeled per the visibility decision
- [ ] Week navigation (previous, next, today) stored in the URL; loading overlay while fetching
- [ ] On narrow screens, switch to a day or agenda view

**Done when:** seeded reservations appear in the exact right slots.
**🛑 Review:** create a reservation by API for a known time and check it lands on the correct slot, and the timezone shown is the org's.
**Commit:** `Add weekly reservation calendar on resource page`

### Task F3.3 — Booking dialog 🟡
- [ ] Selecting a time range on the calendar (drag or click) opens a booking dialog with start and end prefilled
- [ ] Start and end editable through date and time inputs interpreted in the org timezone, converted to UTC ISO on submit
- [ ] Notes field; client-side validation mirrors the server (end after start, not in the past)
- [ ] Submit shows pending state; success closes the dialog, refreshes the calendar, and shows a toast
- [ ] Also reachable through a "Book this resource" button without dragging

**Done when:** you can book via drag and via the button, and the slot shows on the calendar.
**🛑 Review:** book at a time near midnight and confirm the stored UTC time corresponds correctly.
**Commit:** `Add booking dialog with timezone-aware inputs`

### Task F3.4 — Conflict and error handling 🔴
- [ ] On `SLOT_TAKEN`: show an inline alert in the dialog ("Someone just booked this slot"), **refetch the calendar immediately**, and keep the dialog open so the user can choose a different time
- [ ] All other booking error codes map to friendly messages from `errorMessages.js`
- [ ] Network failure shows a retryable error, never a silent failure

**Done when:** open the same resource in two browsers, book the same slot in both: the first succeeds, the second sees the conflict message and a calendar that now shows the taken slot.
**🛑 Review:** run the two-browser test yourself. This is a core demo of the project.
**Commit:** `Handle booking conflicts and errors in the booking dialog`

### Task F3.5 — My reservations 🟡
- [ ] Page with tabs: Upcoming, Past, Cancelled; each row shows resource, time range in org timezone, status badge
- [ ] Cancel action with `ConfirmDialog` (only for upcoming confirmed ones)
- [ ] Empty states per tab; pagination

**Done when:** book, see it listed, cancel it, see it move to Cancelled; the slot becomes bookable again.
**🛑 Review:** cancelled slot is bookable from another account.
**Commit:** `Add my-reservations page with cancellation`

### Task F3.6 — Admin reservations 🟡
- [ ] Admin-only table of all org reservations: resource, user, time range, status, cancel action
- [ ] Filters by resource and status stored in URL params; pagination

**Done when:** an admin can see and cancel any member's reservation.
**🛑 Review:** a member can't reach the page.
**Commit:** `Add admin reservations overview`

### Task F3.7 — Home dashboard 🟢
- [ ] Greeting with name and organization
- [ ] "Your next reservations" (next 3) and quick links to resources and my reservations
- [ ] Good empty state for brand-new users ("Book your first resource")

**Done when:** the home page reflects real data and a new account sees the empty state.
**🛑 Review:** no extra network requests beyond what the page needs.
**Commit:** `Add home dashboard with upcoming reservations`

---

# Phase F4 — Rules and availability screens
*(after backend Tasks 5.1 to 5.3)*

### Task F4.1 — Rules in the admin resource form 🟡
- [ ] Add min duration, max duration, opening time, closing time, and max advance days to the create and edit form
- [ ] Zod validation mirroring the backend (min not above max, opening before closing)
- [ ] Rules summary shown on the resource Details tab

**Done when:** an admin can configure rules and see them reflected.
**🛑 Review:** invalid combinations are blocked client-side and server errors still map to fields.
**Commit:** `Add booking rules to resource admin form and details`

### Task F4.2 — Calendar respects rules 🟡
- [ ] Shade closed hours; limit visible hours to the operating window (in the org timezone)
- [ ] Selection snaps to a sensible granularity and respects the minimum duration
- [ ] Days beyond the advance limit are visually disabled

**Done when:** you can't drag-select in closed hours or too far ahead.
**🛑 Review:** open a resource with different hours than the default and confirm the calendar adapts.
**Commit:** `Make calendar honor operating hours and booking limits`

### Task F4.3 — Availability suggestions 🟡
- [ ] Booking dialog shows suggested free slots from the availability endpoint for the chosen day
- [ ] Clicking a suggestion fills the times
- [ ] Rule-violation error codes show friendly messages
- [ ] Small note in code: availability is a hint, the server decides

**Done when:** suggestions match the rules and booked slots.
**🛑 Review:** book through a suggestion and through a manual time; both are validated server-side.
**Commit:** `Show available slots in booking dialog`

---

# Phase F5 — Polish

### Task F5.1 — Responsive pass 🟡
- [ ] Review every screen at 360px, 768px, and 1280px; fix overflow, cramped tables (use horizontal scroll or card layout), unreachable buttons

**Commit:** `Fix responsive layout issues across screens`

### Task F5.2 — Accessibility pass 🟡
- [ ] Keyboard-only walkthrough of login, booking, and cancel flows
- [ ] Focus moves into dialogs and returns on close; visible focus rings; all inputs labeled; status never color-only; sensible page titles per route

**Commit:** `Improve keyboard navigation and accessibility`

### Task F5.3 — Feedback consistency 🟢
- [ ] Every mutation shows pending state, then a success or error toast; no double-submits possible; consistent wording

**Commit:** `Standardize loading and feedback states across mutations`

### Task F5.4 — Dark mode (optional) 🟢
- [ ] Theme toggle using the existing CSS variable tokens; remembers choice (this one may use localStorage since it's not sensitive); respects system preference by default

**Commit:** `Add dark mode toggle`

### Task F5.5 — Final touches 🟢
- [ ] Favicon, app title, meta description, consistent page titles
- [ ] Friendly "no access" and "not found" pages

**Commit:** `Add favicon, titles, and error pages`

---

# Phase F6 — Testing and shipping

### Task F6.1 — Component tests 🟡
- [ ] Ask before installing a request-mocking library (MSW is the usual choice)
- [ ] Tests for: `ProtectedRoute` and `RoleGate` behavior, server field errors landing on the right inputs, booking dialog showing the conflict message on `SLOT_TAKEN` and staying open, date utilities (already covered)

**Done when:** `npm test` in `client/` passes.
**🛑 Review:** the conflict test would fail if the dialog closed on error.
**Commit:** `Add component tests for guards, forms, and booking conflicts`

### Task F6.2 — End-to-end test 🔴
- [ ] Playwright against the real stack (server, client, test database)
- [ ] Scenario: register a new org, create a resource, book a slot, then in a **second browser context** (another user in the same org) try the same slot and see the conflict message, cancel the first booking, rebook successfully
- [ ] Second scenario: org A cannot see org B's resource
- [ ] Record a short screen capture of the two-context scenario for the README

**Done when:** the e2e suite passes reliably (run it several times).
**🛑 Review:** watch it run headed once to confirm it does what you think.
**Commit:** `Add end-to-end tests for booking conflict and tenant isolation`

### Task F6.3 — Production build check 🟡
*(after backend Task 6.6)*
- [ ] Production build works; Express serves it; client-side routes survive refresh (SPA fallback); the `/_ui` showcase route is absent; no console errors
- [ ] Note the bundle size and flag anything unusually large

**Commit:** `Verify production client build and SPA routing`

### Task F6.4 — README showcase 🟢
- [ ] Screenshots (calendar, booking conflict, admin pages), the e2e capture, and a short "how the double-booking protection works" section linking frontend behavior to the database constraint

**Commit:** `Add screenshots and architecture notes to README`

---

## Before every commit (human checklist)

- [ ] Does the screen have loading, empty, and error states?
- [ ] Are all times shown in the org timezone through the date utilities?
- [ ] Is anything security-relevant relying only on the UI (it shouldn't)?
- [ ] Does the form map server errors onto fields?
- [ ] Is there anything in the diff I don't understand? (Ask the agent to explain or simplify.)
- [ ] Did the agent touch the backend or unrelated files?
- [ ] Does it work at 360px width?
