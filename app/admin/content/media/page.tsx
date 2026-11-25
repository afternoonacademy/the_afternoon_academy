import Link from "next/link"
import Image from "next/image"
import {requireCapability} from "@/lib/auth/require-capability"
import {unusedContentImages} from "@/lib/media/content-cleanup"
import {ContentOrphanDeleteForm} from "@/components/admin/content-orphan-delete-form"
export const dynamic="force-dynamic"

export default async function Page(){
  await requireCapability("manage_setup")
  let assets:Awaited<ReturnType<typeof unusedContentImages>>=[]
  let error=""
  try{assets=await unusedContentImages()}catch(e){error=e instanceof Error?e.message:"Media cleanup unavailable."}
  return <div className="mx-auto max-w-4xl space-y-6 pb-12">
    <Link href="/admin/content" className="text-sm underline">← Back to Content Manager</Link>
    <header className="brand-hero p-6"><h1 className="text-3xl font-bold">Unused image cleanup</h1>
      <p className="mt-3 text-sm">Only files uploaded through Content Manager, older than seven days, and not referenced by any saved article can be deleted here. No automatic deletion is performed.</p>
    </header>
    {error?<p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4">{error}</p>:
      <section className="brand-card space-y-4 p-5">
        <h2 className="text-xl font-bold">Eligible unused uploads ({assets.length})</h2>
        {assets.length===0&&<p className="text-sm text-muted-foreground">No images qualify for cleanup yet. Recently uploaded or article-linked images are protected.</p>}
        <ul className="space-y-4">{assets.map(asset=><li key={asset.public_id} className="grid gap-4 rounded-xl border p-4 sm:grid-cols-[120px_1fr]">
          <Image src={asset.secure_url} alt="Unused article upload" width={120} height={120} className="h-30 w-30 rounded-lg object-contain"/>
          <div className="min-w-0 space-y-2">
            <p className="break-all text-xs">{asset.public_id}</p>
            <p className="text-xs text-muted-foreground">Uploaded: {new Date(asset.created_at).toLocaleDateString("en-GB",{timeZone:"UTC"})} · {Math.ceil(asset.bytes/1024)} KB</p>
            <ContentOrphanDeleteForm publicId={asset.public_id}/>
          </div>
        </li>)}</ul>
      </section>}
    <p className="text-sm text-muted-foreground">Deletion checks all current article references again before removing a file. Assets used elsewhere outside Content Manager must be reviewed separately.</p>
  </div>
}
