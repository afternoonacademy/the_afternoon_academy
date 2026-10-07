# Family Administrative Master Record Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Make the Family profile the canonical household administration record with scalable tabbed navigation and cursor-paginated email history, while simplifying the Learner profile back to teaching-first ownership.

**Architecture:** Keep existing payment, renewal, document and session-change business actions unchanged, but reorganize their presentation under a five-tab Family profile. Introduce a small family-email pagination module plus an Admin-only API route so the initial page and subsequent loads use the same deterministic 25-row cursor contract. Replace duplicated learner commercial/communications tabs with a compact Admin-only family reference.

**Tech Stack:** Next.js 16 App Router, React, TypeScript, Radix Tabs, Tailwind CSS, Supabase/PostgREST, Node test runner.

**Spec:** \`docs/superpowers/specs/2026-10-07-family-admin-master-record-design.md\`

## Global Constraints

- The Family profile is the canonical source of truth for household administration, money, documents and parent-facing communications.
- The Learner profile remains teaching-first and must not duplicate full household communications, payment, renewal or document histories.
- Family administration remains Admin-only through \`view_family_pipeline\`; teacher capabilities do not change.
- Preserve existing customer/renewal, lead-family, payment, standing-placement, session-change, family-balance, registration/authorisation, Resend and email-log semantics.
- Email history loads 25 rows initially and 25 rows per subsequent page.
- Email ordering is deterministic: \`created_at desc, id desc\`.
- Pagination must not skip or duplicate records when multiple messages share \`created_at\`.
- No new email-history table or mailbox import is introduced.
- Do not add email search, category filters, open/click tracking, or Family Updates AI changes.
- Do not deploy to production before explicit founder acceptance.
- Follow the repository deployment-economy rule: batch work and use one coherent release-candidate preview rather than incremental Vercel deploy loops.

## Review Focus

- Two or more emails with the same \`created_at\`: the next-page cursor must continue by \`id\` without duplicates or omissions.
- A malformed/expired pagination cursor: the endpoint must reject it cleanly without exposing data or breaking the already-rendered history.
- A family with no email records: the Email history tab must show the approved empty state without issuing unbounded queries.
- A failure while loading older emails: already-loaded messages must remain visible and the user must be able to retry.
- A Teacher opening learner records: family/admin data must remain hidden and no new route or component may weaken \`view_family_pipeline\` authorization.

---

### Task 1: Create the deterministic family-email pagination contract

**Files:**
- Create: \`lib/admin/family-email-history.mjs\`
- Test: \`tests/family-email-pagination.test.mjs\`

**Interfaces:**
- Produces: \`FAMILY_EMAIL_PAGE_SIZE = 25\`
- Produces: \`encodeFamilyEmailCursor({ createdAt, id }) -> string\`
- Produces: \`decodeFamilyEmailCursor(cursor) -> { createdAt, id }\`
- Produces: \`buildFamilyEmailCursorFilter({ createdAt, id }) -> string\`
- Produces: \`pageFamilyEmailRows(rows, pageSize = 25) -> { items, hasMore, nextCursor }\`
- Consumes: no database dependency; pure functions only so cursor semantics are independently testable.

- [ ] **Step 1: Write the failing cursor and page-boundary tests**

Add tests asserting:

- \`FAMILY_EMAIL_PAGE_SIZE === 25\`
- cursor encode/decode round-trips an ISO timestamp and UUID
- invalid base64/JSON/missing fields throws a controlled \`Invalid family email cursor\` error
- \`buildFamilyEmailCursorFilter\` represents “created_at older OR same created_at and id lower”
- given 26 ordered rows, \`pageFamilyEmailRows\` returns 25 items, \`hasMore: true\`, and a cursor based on item 25
- two rows sharing the same timestamp remain distinct and the cursor uses the final row's id

Run: \`node --test tests/family-email-pagination.test.mjs\`  
Expected: FAIL because the helper does not exist.

- [ ] **Step 2: Implement the pure pagination helper**

Use base64url JSON for the opaque cursor. Validate that \`createdAt\` parses as a date and \`id\` is a UUID-shaped string before returning it.

The PostgREST cursor filter must be equivalent to:

\`created_at.lt.<createdAt>,and(created_at.eq.<createdAt>,id.lt.<id>)\`

Do not put family IDs or authorization data in the cursor.

- [ ] **Step 3: Run the focused pagination tests**

Run: \`node --test tests/family-email-pagination.test.mjs\`  
Expected: PASS.

- [ ] **Step 4: Commit**

\`git add lib/admin/family-email-history.mjs tests/family-email-pagination.test.mjs && git commit -m "feat: add family email pagination contract"\`

---

### Task 2: Add one Admin-only paginated family-email data path

**Files:**
- Create: \`lib/admin/load-family-emails.ts\`
- Create: \`app/api/admin/families/[id]/emails/route.ts\`
- Test: \`tests/family-email-route-contract.test.mjs\`

**Interfaces:**
- Consumes: \`FAMILY_EMAIL_PAGE_SIZE\`, \`decodeFamilyEmailCursor\`, \`buildFamilyEmailCursorFilter\`, \`pageFamilyEmailRows\`
- Produces: \`loadFamilyEmailPage({ parentLeadId, cursor? }) -> Promise<{ items: FamilyCommunication[]; hasMore: boolean; nextCursor: string | null }>\`
- Produces: \`GET /api/admin/families/:id/emails?cursor=<opaque>\`
- The API response shape is exactly \`{ items, hasMore, nextCursor }\`.

- [ ] **Step 1: Write failing route/data-contract tests**

Test source contracts that pin:

- the route calls \`requireCapability("view_family_pipeline")\`
- the loader filters \`email_delivery_log.parent_lead_id\` by the requested family
- the loader orders by \`created_at\` descending then \`id\` descending
- the loader requests \`FAMILY_EMAIL_PAGE_SIZE + 1\` rows to determine \`hasMore\`
- a cursor applies the stable PostgREST filter from Task 1
- the API returns 400 for an invalid cursor rather than falling back to page one

Run: \`node --test tests/family-email-route-contract.test.mjs\`  
Expected: FAIL because loader/route do not exist.

- [ ] **Step 2: Implement \`loadFamilyEmailPage\`**

Use \`supabaseAdmin\` because this is an authenticated internal Admin read path.

Select the same communication fields already rendered by \`FamilyCommunications\`, including child/learner first-name relations.

Apply:

- \`.eq("parent_lead_id", parentLeadId)\`
- optional cursor \`.or(...)\`
- \`.order("created_at", { ascending: false })\`
- \`.order("id", { ascending: false })\`
- \`.limit(FAMILY_EMAIL_PAGE_SIZE + 1)\`

Pass returned rows through \`pageFamilyEmailRows\`.

- [ ] **Step 3: Implement the Admin-only GET route**

Validate the family id as UUID. Call \`requireCapability("view_family_pipeline")\` before loading data. Decode/query failures caused by invalid cursors return HTTP 400 with a concise error; unexpected database errors return 500.

- [ ] **Step 4: Run focused tests**

Run: \`node --test tests/family-email-route-contract.test.mjs tests/family-email-pagination.test.mjs\`  
Expected: PASS.

- [ ] **Step 5: Commit**

\`git add lib/admin/load-family-emails.ts app/api/admin/families/[id]/emails/route.ts tests/family-email-route-contract.test.mjs && git commit -m "feat: paginate family email history"\`

---

### Task 3: Turn Email history into a bounded scrollable activity panel

**Files:**
- Modify: \`components/admin/family-communications.tsx\`
- Create: \`components/admin/family-email-history.tsx\`
- Test: \`tests/family-email-history-ui.test.mjs\`

**Interfaces:**
- Consumes: initial \`FamilyCommunication[]\`, \`hasMore\`, \`nextCursor\`, \`parentLeadId\`
- Produces: \`<FamilyEmailHistory initialItems initialHasMore initialNextCursor parentLeadId />\`
- Fetches: Task 2 API endpoint when “Load older emails” is pressed.
- Reuses: \`FamilyCommunications\` row/detail rendering rather than creating a second email-card format.

- [ ] **Step 1: Write failing UI-contract tests**

Pin these behaviours in source/component tests:

- scroll container has a bounded desktop/mobile height and \`overflow-y-auto\`
- initial rows are rendered newest-first as received from the server
- “Load older emails” appears only when \`hasMore\`
- successful pagination appends rather than replaces existing rows
- failed pagination keeps existing rows and exposes a Retry action
- copy says “recorded Academy email history” rather than “complete” history
- expanded \`details\` still shows retained body and delivery/error information

Run: \`node --test tests/family-email-history-ui.test.mjs\`  
Expected: FAIL.

- [ ] **Step 2: Refactor \`FamilyCommunications\` into a reusable presentational list**

Keep \`FamilyCommunication\` and existing labels/status formatting. Add only the props needed to render a list inside a caller-controlled scroll container; do not make this component fetch data.

- [ ] **Step 3: Implement \`FamilyEmailHistory\` client pagination**

State:

- \`items\`
- \`hasMore\`
- \`nextCursor\`
- \`loading\`
- \`error\`

On load:

- fetch \`/api/admin/families/\${parentLeadId}/emails?cursor=\${encodeURIComponent(nextCursor)}\`
- append returned items
- update \`hasMore/nextCursor\`
- on failure, keep existing \`items\` untouched and show Retry

Use a fixed-height panel around the list; do not make the whole Family page the email scroll surface.

- [ ] **Step 4: Run focused tests**

Run: \`node --test tests/family-email-history-ui.test.mjs\`  
Expected: PASS.

- [ ] **Step 5: Commit**

\`git add components/admin/family-communications.tsx components/admin/family-email-history.tsx tests/family-email-history-ui.test.mjs && git commit -m "feat: add scalable family email activity history"\`

---

### Task 4: Rebuild the Family profile as the five-tab administrative master record

**Files:**
- Modify: \`app/admin/families/[id]/page.tsx\`
- Optionally create focused presentational components under \`components/admin/family-profile/\` only if the page becomes difficult to review; do not move existing business actions.
- Test: \`tests/family-profile-tabs.test.mjs\`

**Interfaces:**
- Consumes: existing family, learner, standing-placement, paid-entitlement, renewal, price-plan, document and registration-delivery queries
- Consumes: \`loadFamilyEmailPage({ parentLeadId })\` for the initial 25 emails
- Consumes: existing \`FamilyBalanceManager\`, \`FamilyDocumentAuthorisation\`, \`SessionChangeLauncher\`
- Produces: Family tabs with values exactly \`overview\`, \`children\`, \`payments\`, \`emails\`, \`documents\`

- [ ] **Step 1: Write failing Family-profile structure tests**

Assert:

- the page still calls \`requireCapability("view_family_pipeline")\`
- exactly the approved tab labels are present: Overview, Children & places, Payments & renewals, Email history, Documents
- Family page uses \`loadFamilyEmailPage\` rather than an unbounded direct \`email_delivery_log\` query
- \`FamilyEmailHistory\` receives the initial page and cursor metadata
- \`FamilyBalanceManager\`, \`SessionChangeLauncher\` and \`FamilyDocumentAuthorisation\` remain wired
- Overview does not render full email bodies/history

Run: \`node --test tests/family-profile-tabs.test.mjs\`  
Expected: FAIL.

- [ ] **Step 2: Rework the header and tab shell**

Use the shared horizontal Tabs component with the same desktop scrollbar-safe class pattern already used by learner records:

\`overflow-x-auto overflow-y-hidden ... lg:overflow-visible\`

Header shows family name, email, optional phone, concise state if available, and Back to Family Pipeline.

- [ ] **Step 3: Build Overview**

Render concise cards only:

- Children count/list with learner links
- Family balance state
- Registration/authorisation state
- Admin attention summary for missing place/payment/renewal conditions

Do not duplicate full histories.

- [ ] **Step 4: Move existing child/session UI into Children & places**

Preserve all current logic and handlers for:

- recurring places
- paid-through date
- future place change
- \`SessionChangeLauncher\`

Add empty state when the family has no learners.

- [ ] **Step 5: Move finance/admin UI into Payments & renewals**

Preserve:

- current family balance
- \`FamilyBalanceManager\`
- account adjustment history
- current renewal status/amount per learner

Do not change calculation or mutation code.

- [ ] **Step 6: Put paginated communications under Email history**

Call \`loadFamilyEmailPage({ parentLeadId: id })\` once for the initial page and pass the result to \`FamilyEmailHistory\`.

The initial Family page must not query all historical email rows.

- [ ] **Step 7: Move registration/authorisation under Documents**

Render \`FamilyDocumentAuthorisation\` in the Documents tab and add a short section heading that can accommodate future document cards.

- [ ] **Step 8: Run Family profile tests**

Run: \`node --test tests/family-profile-tabs.test.mjs tests/family-email-history-ui.test.mjs tests/family-email-route-contract.test.mjs tests/family-email-pagination.test.mjs\`  
Expected: PASS.

- [ ] **Step 9: Commit**

\`git add app/admin/families/[id]/page.tsx components/admin/family-profile tests/family-profile-tabs.test.mjs && git commit -m "feat: make family profile the admin master record"\`

If no \`components/admin/family-profile\` directory was needed, omit it from \`git add\`.

---

### Task 5: Simplify Learner Records to teaching-first ownership

**Files:**
- Modify: \`app/admin/learners/[id]/page.tsx\`
- Test: \`tests/learner-family-ownership.test.mjs\`

**Interfaces:**
- Consumes: existing learner teaching/profile/attendance/goals/framework queries
- Produces: the learner tabs remain teaching-oriented
- Produces: Admin-only compact Family reference with \`/admin/families/:parentLeadId\` link
- Removes: full Family communications rendering and duplicated Family/place admin tab content.

- [ ] **Step 1: Write failing ownership tests**

Assert:

- learner page no longer imports/renders \`FamilyCommunications\`
- learner tab labels no longer include \`Communications\`
- learner page does not render full booked-paid-date or recurring-place management as a separate Family tab
- Admin path still includes \`Open family account\`
- the Admin reference may show concise paid-through/payment state but not full history
- Teacher capability list remains unchanged and no teacher gains \`view_family_pipeline\`

Run: \`node --test tests/learner-family-ownership.test.mjs\`  
Expected: FAIL.

- [ ] **Step 2: Remove duplicated family communication and place-management queries/UI**

Delete the family communications query and the full Communications tab.

Remove the separate full Family & place tab. Keep only the minimum entitlement/family lookup needed for the compact Admin reference.

- [ ] **Step 3: Add the compact Admin-only Family reference**

For users with \`view_family_pipeline\`, show a small card/reference near the learner workspace containing:

- family/parent name when available
- concise payment/paid-through status if already available from the minimal query
- Open family account button

Teachers must not render this block.

- [ ] **Step 4: Run focused tests**

Run: \`node --test tests/learner-family-ownership.test.mjs tests/learner-workspace-policy.test.mjs tests/admin-route-policy.test.mjs\`  
Expected: PASS.

- [ ] **Step 5: Commit**

\`git add app/admin/learners/[id]/page.tsx tests/learner-family-ownership.test.mjs && git commit -m "refactor: keep learner records teaching first"\`

---

### Task 6: Documentation, full verification and one release-candidate preview

**Files:**
- Modify: \`docs/product/project-change-log.md\`
- Modify: \`docs/engineering/current-baseline.md\`
- Modify: \`docs/superpowers/plans/2026-10-07-family-admin-master-record.md\`

**Interfaces:**
- Consumes: completed Tasks 1–5
- Produces: current project documentation and release evidence

- [ ] **Step 1: Update baseline and change log**

Record:

- Family profile is now the canonical household admin record
- five-tab ownership model
- email history page size/cursor behaviour
- learner profile teaching-first ownership
- no changes to payment/renewal/session/document business semantics

- [ ] **Step 2: Run the complete repository test suite**

Run: \`npm test\`  
Expected: all tests PASS, 0 failures.

- [ ] **Step 3: Run the production build**

Run: \`npm run build\`  
Expected: Next.js compile, TypeScript and static generation all PASS. The known middleware/proxy deprecation warning may remain; do not broaden this feature to fix it.

- [ ] **Step 4: Perform a distinct whole-branch review**

Review the final branch diff against the design spec, specifically checking:

- authorization boundaries
- stable pagination
- accidental duplication of family/learner ownership
- preservation of existing server actions
- mobile tab overflow and desktop scrollbar behaviour

Fix only findings within this feature's scope, rerun affected tests, and commit any review fixes separately.

- [ ] **Step 5: Push once for the coherent release-candidate preview**

Do not use Vercel as the development loop. Push the completed/reviewed branch once the local/repository verification is green.

- [ ] **Step 6: Verify the Vercel preview**

Verify on desktop and mobile:

- Family header and five tabs
- Overview remains concise
- Children & places actions still work
- Payments & renewals retains existing actions
- Email history is bounded/scrollable and loads older pages
- retry state preserves existing emails
- Documents workflow remains intact
- learner profile contains only teaching surfaces plus Admin family reference
- Teacher view does not expose family admin data

- [ ] **Step 7: Human acceptance gate**

Do not merge or promote to production until the founder explicitly accepts the preview.

- [ ] **Step 8: Commit documentation**

\`git add docs/product/project-change-log.md docs/engineering/current-baseline.md docs/superpowers/plans/2026-10-07-family-admin-master-record.md && git commit -m "docs: record family administrative master record"\`
