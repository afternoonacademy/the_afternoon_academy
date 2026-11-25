"use client"
import { useRef, useState } from "react"
import Image from "next/image"
import { ImagePlus, Upload, X } from "lucide-react"

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
  const clear=()=>{
    setUrl("")
    setMessage("Image removed from this article. Save to confirm.")
    if(input.current)input.current.value=""
  }
  return <div className="space-y-3 rounded-xl border p-4">
    <p className="text-sm font-semibold">Article image</p>
    <input ref={input} id="guide-image-upload" aria-label="Upload article image"
      accept="image/png,image/jpeg,image/webp" type="file"
      className="sr-only" disabled={busy}
      onChange={event=>{const file=event.currentTarget.files?.[0];if(file)void upload(file)}}/>
    <input type="hidden" name="image_path" value={url}/>
    {url ? <div className="space-y-3">
      <div className="relative w-fit max-w-full">
        <Image src={url} alt="Selected article image" width={480} height={320}
          className="max-h-72 w-auto max-w-full rounded-xl border object-contain"/>
        <button type="button" onClick={clear} disabled={busy}
          aria-label="Remove selected image" title="Remove image"
          className="absolute right-2 top-2 flex size-9 items-center justify-center rounded-full bg-white text-slate-900 shadow-md hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
          <X aria-hidden="true" className="size-5"/>
        </button>
      </div>
      <label htmlFor="guide-image-upload" aria-disabled={busy}
        className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-slate-50 ${busy?"pointer-events-none opacity-50":""}`}>
        <Upload aria-hidden="true" className="size-4"/> Replace image
      </label>
    </div> : <label htmlFor="guide-image-upload" aria-disabled={busy}
      className={`flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-blue-500 hover:bg-blue-50 ${busy?"pointer-events-none opacity-50":""}`}>
      <span className="flex size-12 items-center justify-center rounded-full bg-white text-blue-700 shadow-sm">
        <ImagePlus aria-hidden="true" className="size-6"/>
      </span>
      <span className="inline-flex items-center gap-2 font-semibold text-blue-800">
        <Upload aria-hidden="true" className="size-4"/> Click to upload an article image
      </span>
      <span className="text-xs text-slate-600">Choose a photo from your computer</span>
    </label>}
    {busy&&<p role="status" className="text-sm">Uploading image to Cloudinary…</p>}
    {message&&<p role="status" className="text-sm">{message}</p>}
    <p className="text-xs text-muted-foreground">JPEG, PNG or WebP · maximum 8 MB. Upload only marketing-approved imagery, with appropriate consent for identifiable children.</p>
  </div>
}
