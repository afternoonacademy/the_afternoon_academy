import { GuideImageUploader } from "@/components/admin/guide-image-uploader"
import { GuideTitleFields } from "@/components/admin/guide-title-fields"
import Link from "next/link"
import { requireCapability } from "@/lib/auth/require-capability"
import { guidePosts } from "@/lib/content/guide-posts"
import { saveGuidePost,publishGuidePost } from "@/actions/guide-posts"
export const dynamic="force-dynamic"
export default async function Page({searchParams}:{searchParams:Promise<{edit?:string;saved?:string}>}){
  await requireCapability("manage_setup")
  const params=await searchParams
  let posts:Awaited<ReturnType<typeof guidePosts>>=[]
  let unavailable=false
  try{posts=await guidePosts()}catch{unavailable=true}
  const current=posts.find(p=>p.id===params.edit)
  const cls="block w-full rounded-xl border bg-white px-3 py-2 text-sm"
  const item=(name:string,label:string,kind:"input"|"textarea"="input",required=true)=>(
    <label key={name} className="block space-y-1 text-sm font-semibold"><span>{label}</span>
      {kind==="textarea"?<textarea name={name} defaultValue={String(current?.[name as keyof typeof current]||"")} rows={name.startsWith("body")?10:3} className={cls} required={required}/>:
      <input name={name} defaultValue={String(current?.[name as keyof typeof current]||"")} className={cls} required={required}/>}
    </label>)
  return <div className="mx-auto max-w-5xl space-y-6 pb-12">
    <header className="brand-hero p-6"><p className="brand-kicker">Editorial workspace</p><h1 className="mt-2 text-3xl font-bold">Content Manager</h1><p className="mt-3 text-sm">Write, review and publish parent resources in English and Spanish. Publication is always a separate action. This preview uses the existing Academy database, so do not publish experimental content.</p></header>
    {unavailable?<div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-5"><b>Editorial database not yet configured.</b><p className="mt-2 text-sm">The additive migration is awaiting an isolated test environment and release approval. Existing Guides remain available.</p></div>:<>
    {params.saved&&<p role="status" className="rounded-xl border bg-green-50 p-3">Content saved successfully.</p>}
    <section className="brand-card p-5"><div className="flex justify-between gap-3"><h2 className="text-xl font-bold">Articles</h2><Link href="/admin/content" className="text-sm underline">New article</Link></div>
      <div className="mt-4 space-y-2">{posts.length===0?<p className="text-sm text-muted-foreground">No articles added through Content Manager yet.</p>:posts.map(p=><Link key={p.id} href={"/admin/content?edit="+p.id} className="block rounded-xl border p-3 hover:bg-slate-50"><b>{p.title_en}</b><span className="ml-3 text-xs text-muted-foreground">{p.category} · {p.status}</span></Link>)}</div>
    </section>
    <form action={saveGuidePost} className="brand-card space-y-4 p-5">
      <h2 className="text-xl font-bold">{current?"Edit article":"New article"}</h2>
      <input name="id" type="hidden" value={current?.id||""}/>
      <GuideTitleFields key={current?.id||"new"} initialTitle={current?.title_en||""} existingSlug={current?.slug||""}/>
      <label className="block space-y-1 text-sm font-semibold"><span>Category</span><select name="category" defaultValue={current?.category||"resources"} className={cls}><option value="resources">Parent resources</option><option value="supports">Academic support</option><option value="neighbourhoods">Neighbourhood guides</option></select></label>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4"><h3 className="font-bold">English</h3><p className="text-xs text-muted-foreground">The English title and generated URL are above.</p>{item("summary_en","Summary","textarea")}{item("body_en","Article text","textarea")}</div>
        <div className="space-y-4"><h3 className="font-bold">Español</h3>{item("title_es","Título")}{item("summary_es","Resumen","textarea")}{item("body_es","Texto del artículo","textarea")}</div>
      </div>
      <GuideImageUploader key={current?.id||"new"} initialUrl={current?.image_path||""}/>
      {item("source_url","Research/source HTTPS URL (optional)","input",false)}
      <p className="text-xs text-muted-foreground">Use plain text and paragraph breaks. HTML is never interpreted. Upload a JPEG, PNG or WebP image (up to 8 MB) above; uploads go directly to the Academy Cloudinary library through a protected server endpoint. Saving a published article returns it to draft and removes it from the public pages until you explicitly publish again. Existing article slugs cannot be changed. Save, then use publication controls below.</p>
      <button className="rounded-xl bg-[#26345f] px-5 py-3 font-semibold text-white">Save article</button>
    </form>
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
      <form action={publishGuidePost}><input name="id" type="hidden" value={current.id}/><input name="status" type="hidden" value={current.status==="published"?"draft":"published"}/><button className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white">{current.status==="published"?"Unpublish article":"Publish both languages"}</button></form>
      {current.status==="published"&&<Link className="text-sm underline" href={"/guide/posts/"+current.slug}>View published article</Link>}
    </section>}
    </>}
  </div>
}
