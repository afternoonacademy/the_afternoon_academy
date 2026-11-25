import { GuideArticleSaveForm } from "@/components/admin/guide-article-save-form"
import { GuidePublicationForm } from "@/components/admin/guide-publication-form"
import { GuideImageUploader } from "@/components/admin/guide-image-uploader"
import { GuideTitleFields } from "@/components/admin/guide-title-fields"
import Link from "next/link"
import { requireCapability } from "@/lib/auth/require-capability"
import { guidePosts,guideCategories } from "@/lib/content/guide-posts"
import { addGuideCategory } from "@/actions/guide-categories"
export const dynamic="force-dynamic"
export default async function Page({searchParams}:{searchParams:Promise<{edit?:string;saved?:string;category_added?:string}>}){
  await requireCapability("manage_setup")
  const params=await searchParams
  let posts:Awaited<ReturnType<typeof guidePosts>>=[]
  let unavailable=false
  let categories:Awaited<ReturnType<typeof guideCategories>>=[]
  try{[posts,categories]=await Promise.all([guidePosts(),guideCategories()])}catch{unavailable=true}
  const current=posts.find(p=>p.id===params.edit)
  const cls="block w-full rounded-xl border bg-white px-3 py-2 text-sm"
  const item=(name:string,label:string,kind:"input"|"textarea"="input",required=false)=>(
    <label key={name} className="block space-y-1 text-sm font-semibold"><span>{label}</span>
      {kind==="textarea"?<textarea name={name} defaultValue={String(current?.[name as keyof typeof current]||"")} rows={name.startsWith("body")?10:3} className={cls} required={required}/>:
      <input name={name} defaultValue={String(current?.[name as keyof typeof current]||"")} className={cls} required={required}/>}
    </label>)
  return <div className="mx-auto max-w-5xl space-y-6 pb-12">
    <header className="brand-hero p-6"><p className="brand-kicker">Editorial workspace</p><h1 className="mt-2 text-3xl font-bold">Content Manager</h1><p className="mt-3 text-sm">Write articles in English and Spanish. Save incomplete drafts at any time; both languages are checked when you publish. This preview uses the existing Academy database, so use the private Test category for experiments.</p></header>
    {unavailable?<div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-5"><b>Editorial database not yet configured.</b><p className="mt-2 text-sm">The additive migration is awaiting an isolated test environment and release approval. Existing Guides remain available.</p></div>:<>
    {params.category_added&&<p role="status" className="rounded-xl border bg-green-50 p-3">Category created.</p>}
    {params.saved&&<p role="status" className="rounded-xl border bg-green-50 p-3">Content saved successfully.</p>}
    <section className="brand-card p-5"><div className="flex justify-between gap-3"><h2 className="text-xl font-bold">Articles</h2><Link href="/admin/content" className="text-sm underline">New article</Link></div>
      <div className="mt-4 space-y-2">{posts.length===0?<p className="text-sm text-muted-foreground">No articles added through Content Manager yet.</p>:posts.map(p=><Link key={p.id} href={"/admin/content?edit="+p.id} className="block rounded-xl border p-3 hover:bg-slate-50"><b>{p.title_en}</b><span className="ml-3 text-xs text-muted-foreground">{p.category} · {p.status}</span></Link>)}</div>
    </section>
    <GuideArticleSaveForm>
      <h2 className="text-xl font-bold">{current?"Edit article":"New article"}</h2>
      <input name="id" type="hidden" value={current?.id||""}/>
      <GuideTitleFields key={current?.id||"new"} initialTitle={current?.title_en||""} existingSlug={current?.slug||""}/>
      <label className="block space-y-1 text-sm font-semibold"><span>Category</span>
        <select name="category" defaultValue={current?.category||"resources"} className={cls}>
          {categories.map(c=><option key={c.slug} value={c.slug}>{c.title_en}{c.kind==="test"?" — private testing":""}</option>)}
        </select>
      </label>
      {current?.category==="test"&&<p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-semibold">Test articles are private and cannot be published. Open the protected preview to check the frontend.</p>}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4"><h3 className="font-bold">English</h3><p className="text-xs text-muted-foreground">The English title and generated URL are above.</p>{item("summary_en","Summary","textarea")}{item("body_en","Article text","textarea")}</div>
        <div className="space-y-4"><h3 className="font-bold">Español</h3>{item("title_es","Título")}{item("summary_es","Resumen","textarea")}{item("body_es","Texto del artículo","textarea")}</div>
      </div>
      <GuideImageUploader key={current?.id||"new"} initialUrl={current?.image_path||""}/>
      {item("source_url","Research/source HTTPS URL (optional)","input",false)}
      <p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-950"><strong>Draft workflow:</strong> Enter an English title to generate the shared article URL, then save whenever you like. The Spanish title, summaries and article bodies can be completed later. Both language versions are required before public publication. The Spanish title is translated editorial copy, not a separate URL field.</p>
      <p className="text-xs text-muted-foreground">Use plain text and paragraph breaks. HTML is never interpreted. Upload a JPEG, PNG or WebP image (up to 8 MB) above; uploads go directly to the Academy Cloudinary library through a protected server endpoint. Saving a published article returns it to draft and removes it from the public pages until you explicitly publish again. Existing article slugs cannot be changed. Save, then use publication controls below.</p>
    </GuideArticleSaveForm>
    {current&&<section className="brand-card space-y-4 p-5"><h2 className="text-xl font-bold">Review & publish</h2>
      <div className="flex flex-wrap gap-3">
        <Link href={"/guide/preview/"+current.id} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-blue-700 px-4 py-3 text-sm font-semibold text-blue-800 hover:bg-blue-50">
          Preview English article <span aria-hidden="true">↗</span>
        </Link>
        <Link href={"/es/guia/preview/"+current.id} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-blue-700 px-4 py-3 text-sm font-semibold text-blue-800 hover:bg-blue-50">
          Vista previa en español <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <p className="text-sm text-muted-foreground">Previews open in a new tab and show the last saved draft, including its selected image. Save changes first to see them in the preview.</p>
      {current.category==="test"?
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-semibold">
          Test-only article. Publishing is disabled. Use the private preview links above.
        </p>:
        <GuidePublicationForm id={current.id} status={current.status}/>}
      {current.status==="published"&&<Link className="text-sm underline" href={"/guide/posts/"+current.slug}>View published article</Link>}
    </section>}
      <section className="brand-card space-y-4 p-5">
        <h2 className="text-xl font-bold">Manage categories</h2>
        <p className="text-sm text-muted-foreground">Create future bilingual categories without code changes. The Test category is permanently private.</p>
        <div className="flex flex-wrap gap-2">{categories.map(c=><span key={c.slug} className="rounded-full border px-3 py-1 text-xs">{c.title_en} / {c.title_es}{c.kind==="test"?" · Private":""}</span>)}</div>
        <form action={addGuideCategory} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <label className="block space-y-1 text-sm font-semibold">English category<input name="title_en" required minLength={3} maxLength={100} className={cls} placeholder="Exam preparation"/></label>
          <label className="block space-y-1 text-sm font-semibold">Categoría en español<input name="title_es" required minLength={3} maxLength={100} className={cls} placeholder="Preparación de exámenes"/></label>
          <button className="rounded-xl bg-[#26345f] px-4 py-2 text-sm font-semibold text-white">Add category</button>
        </form>
      </section>
      <section className="brand-card space-y-3 p-5">
        <h2 className="text-xl font-bold">Private frontend testing</h2>
        <p className="text-sm text-muted-foreground">Preview test articles in the real website layout, accessible only to authorised Academy admins.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/guide/test" target="_blank" rel="noopener noreferrer" className="rounded-xl border px-4 py-2 text-sm font-semibold">English test area ↗</Link>
          <Link href="/es/guia/test" target="_blank" rel="noopener noreferrer" className="rounded-xl border px-4 py-2 text-sm font-semibold">Zona de pruebas ↗</Link>
        </div>
      </section>
    </>}
  </div>
}
