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


## Founder-provided target schools and campus-first SEO strategy — 19 October 2026

The following are founder-provided candidate URLs, **not yet independently verified or approved for indexing**. Research each campus location, school identity, ages/curriculum and local relevance using official school sources before publishing. Treat separate Hastings campuses as separate pages because local search intent and school journeys differ; distinguish their URLs and do not conflate with the whole Hastings network.

| Candidate / campus | Official URL supplied | Editorial status |
|---|---|---|
| Hastings School — Lorenzo Solano Tendero (Arturo Soria intent) | https://www.hastingsschool.com/facilities-location/lorenzo-solano-tendero-campus/ | Verify address, campus and relevant ages |
| Hastings School — Sobradiel campus | https://www.hastingsschool.com/facilities-location/sobradiel-campus/ | Verify address, campus and relevant ages |
| Montessori Conde Orgaz | https://montessoricondeorgaz.es/ | Verify identity, location, age groups |
| Maristas Ibérica | https://maristasiberica.com/ | This is a network site: identify the actual nearby school/campus before making a school page |
| International School of Madrid | https://internationalschoolofmadrid.com/ | Verify relevant campus(es), age groups and catchment |
| Brains Arturo Soria | https://www.colegiobrains.com/colegios/arturo-soria/ | Verify campus and curriculum |
| Dallington School | https://dallingtonschool.com/ | Verify campus and age groups |
| Lycée Français de Madrid | https://lfmadrid.org/ | Verify campus and neighbourhood relevance |

### Content and URL architecture

- Maintain one **school entity** and separate **campus entity** where multiple sites exist; campus page targets location-specific intent. Proposed Hastings slugs: `hastings-lorenzo-solano-tendero` and `hastings-sobradiel`. Existing generic `hastings-school` page should become a school-level overview or redirect, not compete with campus pages.
- School pages answer: who the school serves (verified), exact campus and official source, nearby neighbourhood context, what a parent should check when planning after-school routines, and why TAA's Calle Asura 40 provision may be relevant. No fabricated walk times or affiliation.
- Support existing and prospective parents differently: existing families need practical school-day and after-school support; prospective families need verified official admissions/curriculum links and neighbourhood orientation. Do not act as a school rankings or admissions authority.
- Link school → campus → neighbourhood → relevant support → existing enquiry. Distinguish British, international, Montessori, Spanish and French curricula; never imply TAA teaches each school's exact curriculum unless independently substantiated.
- Publish bilingual, independently useful pages only after verification and editorial review. Record source URL, last checked date, verified address, actual campus name, and any claims needing review. Unverified candidates stay draft/unindexed.
- Prioritize geography and realistic journeys from TAA; being in the broad Madrid area does not automatically mean a school is a convenient neighbour.
- Track discovery, qualified enquiries and enrolments by school/campus with privacy-respecting attribution and no learner-level public reporting.


## School guide editorial policy — mandatory (19 October 2026)

TAA is an independent local directory publisher, NOT an authority on, reviewer of, or affiliate of the listed schools. Present only attributed, verifiable facts from each school's own current website or marketing materials. Attribute school descriptions explicitly (e.g. 'The school states...') and link to official sources. Do not invent school-specific facilities, curricula, outcomes, admissions, fees, transport, endorsements or rankings. Never judge whether a school is good or suitable for a child; avoid advice about what parents should ask a school on school-specific profile pages. Provide a neutral, useful digest organised by campus, published age/stage, curriculum/language, facilities, school day/extracurriculars, admissions/contact where substantiated; omit unverified fields rather than filling with generic opinion. Clearly distinguish a short, separately labelled TAA service section from the school profile. Every page must state that TAA is not affiliated with, sponsored by or endorsed by the school, and that current information should be confirmed directly with the school. Avoid copying lengthy marketing text verbatim: paraphrase accurately with attribution. Publish only records whose claims have been checked against cited official URLs; retain review dates. Bilingual translations must not introduce extra facts.
