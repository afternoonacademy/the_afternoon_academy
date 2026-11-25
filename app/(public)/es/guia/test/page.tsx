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
  return <DiscoveryLayout lang="es" switchHref="/guide/test">
    <p className="brand-kicker">Pruebas editoriales privadas</p>
    <h1 className="mb-3 mt-3 text-4xl font-bold">Artículos de prueba</h1>
    <p className="brand-muted mb-8 text-sm">Solo los administradores pueden acceder a esta zona. No se indexa ni se publica.</p>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {posts.length===0&&<p className="brand-muted">Todavía no hay artículos de prueba. Crea uno en la categoría Pruebas.</p>}
      {posts.map(post=><Link key={post.id} href={"/es/guia/preview/"+post.id} className="brand-card block rounded-xl p-5 hover:shadow-md">
        <h2 className="text-xl font-semibold">{post.title_es}</h2>
        <p className="brand-muted mt-2 text-sm">{post.summary_es}</p>
        <span className="mt-4 block text-sm font-semibold">Ver artículo de prueba →</span>
      </Link>)}
    </div>
  </DiscoveryLayout>
}
