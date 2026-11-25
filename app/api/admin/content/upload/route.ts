import { NextRequest,NextResponse } from "next/server"
import { createHash,randomUUID } from "node:crypto"
import { assertCapability } from "@/lib/auth/require-capability"

export const runtime = "nodejs"
export async function POST(request:NextRequest) {
  const origin=request.headers.get("origin")
  const host=request.headers.get("host")
  let sameOrigin=false
  try { sameOrigin=!!origin&&!!host&&new URL(origin).host===host } catch {}
  if(!sameOrigin)return NextResponse.json({error:"Invalid upload origin."},{status:403})
  await assertCapability("manage_setup")
  const cloud=process.env.CLOUDINARY_CLOUD_NAME
  const key=process.env.CLOUDINARY_API_KEY
  const secret=process.env.CLOUDINARY_API_SECRET
  if(cloud!=="s6cu3nwk"||!key||!secret)return NextResponse.json({error:"Cloudinary upload credentials are not yet configured for this deployment."},{status:503})
  const folder="taa/content"
  const publicId=randomUUID()
  const timestamp=Math.floor(Date.now()/1000)
  const allowedFormats="jpg,png,webp"
  const toSign=`allowed_formats=${allowedFormats}&folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${secret}`
  const signature=createHash("sha1").update(toSign).digest("hex")
  return NextResponse.json({cloud,apiKey:key,folder,publicId,timestamp,allowedFormats,signature},{headers:{"Cache-Control":"no-store"}})
}
