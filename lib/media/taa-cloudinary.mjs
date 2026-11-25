// Verified Cloudinary asset inventory for the TAA website. Local files stay as fallback.
export const taaCloudinaryHost = "https://res.cloudinary.com/s6cu3nwk/image/upload/"
export const siteImages = Object.freeze({
  "/images/homework-guide/taa-drawing-activity-enhanced.jpg": taaCloudinaryHost+"v1795604620/taa/site/homework/taa-drawing-activity-enhanced.jpg",
  "/images/homework-guide/taa-teacher-support-enhanced.jpg": taaCloudinaryHost+"v1795604671/taa/site/homework/taa-teacher-support-enhanced.jpg",
  "/main_frontage.png": taaCloudinaryHost+"v1795604676/taa/site/location/main_frontage.png",
  "/classroom-1.jpg": taaCloudinaryHost+"v1795604680/taa/site/location/classroom-1.jpg",
  "/classroom-2.jpg": taaCloudinaryHost+"v1795604684/taa/site/location/classroom-2.jpg",
  "/logo.png": taaCloudinaryHost+"v1795604688/taa/site/brand/logo.png",
  "/og-image.png": taaCloudinaryHost+"v1795604691/taa/site/brand/og-image.png",
})
export function siteImage(path) { return siteImages[path] || path }
export function isCloudinaryEditorialImage(value) {
  return typeof value === "string" &&
    /^https:\/\/res\.cloudinary\.com\/s6cu3nwk\/image\/upload\/v[0-9]+\/taa\/content\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/.test(value)
}
export function isApprovedArticleImage(value) {
  return !value || isCloudinaryEditorialImage(value) ||
    Object.prototype.hasOwnProperty.call(siteImages, value)
}
