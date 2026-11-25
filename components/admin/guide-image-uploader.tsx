"use client"
import { useRef, useState } from "react"
import Image from "next/image"

export function GuideImageUploader({initialUrl=""}:{initialUrl?:string}) {
  const [url,setUrl]=useState(initialUrl)
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState("")
  const input=useRef<HTMLInputElement>(null)
  async function upload(file:File) {
    setBusy(true);setMessage("")
    try {
      if(file.size<=0||file.size>8*1024*1024)throw new Error("Choose an image under 8 MB.")
      if(!["image/jpeg","image/png","image/webp"].includes(file.type))throw new Error("Choose a JPEG, PNG or WebP image.")
      const signed=await fetch("/api/admin/content/upload",{method:"POST",credentials:"same-origin"})
      const credentials=await signed.json()
      if(!signed.ok)throw new Error(credentials.error||"Upload is not configured.")
      const payload=new FormData()
      payload.set("file",file)
      payload.set("folder",credentials.folder)
      payload.set("public_id",credentials.publicId)
      payload.set("allowed_formats",credentials.allowedFormats)
      payload.set("timestamp",String(credentials.timestamp))
      payload.set("api_key",credentials.apiKey)
      payload.set("signature",credentials.signature)
      const response=await fetch(`https://api.cloudinary.com/v1_1/${credentials.cloud}/image/upload`,{method:"POST",body:payload})
      const result=await response.json()
      if(!response.ok||!result.secure_url||!String(result.public_id||"").startsWith("taa/content/"))throw new Error("Cloudinary rejected the image upload.")
      setUrl(result.secure_url)
      setMessage("Image uploaded. Save the article to associate it with the draft.")
    }catch(error){setMessage(error instanceof Error?error.message:"Image upload failed.")}
    finally{setBusy(false)}
  }
  return <div className="space-y-3 rounded-xl border p-4">
    <label className="block text-sm font-semibold" htmlFor="guide-image-upload">Article image</label>
    <input ref={input} id="guide-image-upload" accept="image/png,image/jpeg,image/webp" type="file" className="block w-full text-sm" disabled={busy}
      onChange={event=>{const file=event.currentTarget.files?.[0];if(file)void upload(file)}}/>
    <input type="hidden" name="image_path" value={url}/>
    {busy&&<p role="status" className="text-sm">Uploading image securely…</p>}
    {message&&<p role="status" className="text-sm">{message}</p>}
    {url&&<div className="space-y-2">
      <Image src={url} alt="Selected article image" width={480} height={320} className="max-h-64 w-auto rounded-lg object-contain"/>
      <button type="button" className="text-sm underline" onClick={()=>{setUrl("");setMessage("Image removed from this article. Save to confirm.");if(input.current)input.current.value=""}}>Remove from article</button>
    </div>}
    <p className="text-xs text-muted-foreground">JPEG, PNG or WebP · maximum 8 MB. Use only images cleared for public marketing and publication. No children’s identifying images without the required permissions.</p>
  </div>
}
