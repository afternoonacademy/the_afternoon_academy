import type {Metadata} from "next"
import Link from "next/link"
import {requireCapability} from "@/lib/auth/require-capability"
import {guidePosts} from "@/lib/content/guide-posts"
import {DiscoveryLayout} from "@/components/discovery/discovery-layout"
export const dynamic="force-dynamic"
export const metadata:Metadata={robots:{index:false,follow:false}}
export default async function Page(){
  await requireCapability("manage_setup")
  const posts=(await guidePosts()).filter(post=>post.category==="test")
  return <DiscoveryLayout lang="en" switchHref="/es/guia/test">
    <p className="brand-kicker">Private editorial testing</p>
    <h1 className="mb-3 mt-3 text-4xl font-bold">Test articles</h1>
    <p className="brand-muted mb-8 text-sm">Only Academy administrators can access this area. Not indexed or publicly published.</p>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {posts.length===0&&<p className="brand-muted">No test articles yet. Create one in the Test category.</p>}
      {posts.map(post=><Link key={post.id} href={"/guide/preview/"+post.id} className="brand-card block rounded-xl p-5 hover:shadow-md">
        <h2 className="text-xl font-semibold">{post.title_en}</h2>
        <p className="brand-muted mt-2 text-sm">{post.summary_en}</p>
        <span className="mt-4 block text-sm font-semibold">View article preview →</span>
      </Link>)}
    </div>
  </DiscoveryLayout>
}
