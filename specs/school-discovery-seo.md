# School Discovery SEO — Implementation plan (19 October 2026)

Status: founder-approved direction; implementation and release pending verification.

## Goal
Create a bilingual, school-neighbourhood discovery network for parents attending or considering British/international schools near TAA in Madrid. Position TAA as a helpful independent neighbour, not an official school representative. Preserve the existing Homework Club offer and family enquiry pipeline.

## Scope
- Reusable public school directory and individual school profiles; neighbourhood hubs; academic support and parent-resource pages.
- Initial coverage: Arturo Soria, Conde Orgaz, Piovera and adjacent relevant catchments. Target approximately 15-25 verified school/campus profiles, 5-8 neighbourhood guides, 6-10 support pages and 5-8 parent resources; publish only substantiated useful pages.
- Spanish and English routes with correct language metadata, hreflang, canonical URLs, sitemap, robots rules, breadcrumbs, metadata, and appropriate structured data.
- Independent-provider disclosure, official school source links, last-reviewed dates and correction/contact route.
- Contextual TAA CTA leading to the existing lead/enquiry workflow; optionally prefill school and page attribution without changing payment, enrollment, or learner records.
- Source-driven content records with distinct factual data, source URLs, verification state and editorial approval. Never fabricate walking times, ratings, outcomes, affiliations or school facts.
- Track Search Console indexation, school/neighbourhood query impressions, qualified enquiries and eventual conversion using privacy-conscious aggregate attribution.

## Non-goals
No school reviews/rankings, implied endorsement, child-level results, parent testimonials without permission, new public booking calendar, automated school outreach, mass AI publishing without human fact review, or new parallel CRM.

## Technical approach
Inspect existing Next.js App Router structure, marketing design system, sitemap, locale patterns and current enquiry endpoints before changing code. Prefer static typed content in repository initially; Supabase schema/migrations only if a demonstrated editorial workflow needs them. Keep pages public and segregated from authenticated learner operations. Preserve existing routes, SEO and analytics.

## Roles, data, safety
Public visitors may read approved directory data only. Editorial changes via reviewed GitHub PR; no public writes to school data. Parent enquiry goes through existing validated lead pipeline and current privacy notice. Do not expose family/learner data or aggregate school-level results for small cohorts. Never send identifiable family or child data to AI.

## Build phases
1. Inventory current public routes, enquiry forms, SEO and deploy triggers; verify canonical TAA address and source list.
2. Implement data schema, shared directory/profile components, directory landing page and bilingual locale strategy.
3. Populate verified school/campus records and genuinely differentiated local information; create neighbourhood, support and resource pages.
4. Wire contextual enquiry CTA to existing lead flow and minimal privacy-conscious source attribution.
5. Add structured metadata, XML sitemap, internal linking, canonical/hreflang, source/review notices, and SEO tests.
6. Run existing automated tests, lint, typecheck, production build, QA/security review; one coherent Vercel preview for founder acceptance.
7. After acceptance merge and verify production, submit sitemap through Search Console and measure conversions.

## Acceptance criteria
- No existing operational, payment or authenticated routes regress.
- Each indexed school page contains checked school-specific value, source URLs and clear non-affiliation language.
- No fabricated distance, endorsement, review, statistic or school-specific student result.
- Correct bilingual metadata and valid sitemap/canonicals; mobile accessibility and navigation.
- Enquiry reaches the existing Family Pipeline with no duplicate records or unauthorized writes.
- No database migration required for initial public content; any later schema change gets separate review.
- All tests/build checks pass and founder approves preview before production release.

## Failure handling and rollback
Missing/unverified school records remain unpublished; broken source or map links degrade gracefully. Rollback via reverting feature PR/deployment; preserve existing lead path and production database untouched. Review Vercel auto-preview trigger before commits to avoid excessive builds.

## Open verification items
Current TAA public URL and physical address; actual existing bilingual implementation; school campus sources and exact distances; production Supabase account/project identity (current connector only exposes unrelated Fixtup projects). These are verification items, not reasons to create a new database.
