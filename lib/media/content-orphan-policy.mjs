export const MIN_ORPHAN_AGE_MS=7*24*60*60*1000
const prefix="taa/content/"
export function contentPublicId(url) {
  if(typeof url!=="string")return null
  const match=url.match(/^https:\/\/res\.cloudinary\.com\/s6cu3nwk\/image\/upload\/v\d+\/(taa\/content\/[a-f0-9-]{36})\.(?:png|jpe?g|webp)$/i)
  return match?match[1]:null
}
export function isManagedContentId(value) {
  return typeof value==="string"&&/^taa\/content\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)
}
export function eligibleOrphans(assets,articleImageUrls,now=Date.now()) {
  const referenced=new Set(articleImageUrls.map(contentPublicId).filter(Boolean))
  return assets.filter(asset=>{
    if(!isManagedContentId(asset.public_id)||referenced.has(asset.public_id))return false
    if(asset.resource_type!=="image"||asset.type!=="upload")return false
    const created=Date.parse(asset.created_at||"")
    return Number.isFinite(created)&&created>0&&created<=now-MIN_ORPHAN_AGE_MS
  })
}
