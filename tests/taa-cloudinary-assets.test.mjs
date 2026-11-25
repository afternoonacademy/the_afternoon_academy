import test from "node:test"
import assert from "node:assert/strict"
import { siteImages,siteImage,isCloudinaryEditorialImage,isApprovedArticleImage } from "../lib/media/taa-cloudinary.mjs"
test("existing approved site imagery resolves to the verified TAA Cloudinary cloud",()=>{
  assert.equal(Object.keys(siteImages).length,7)
  for(const [local,cloud] of Object.entries(siteImages)){
    assert.equal(siteImage(local),cloud)
    assert.match(cloud,/^https:\/\/res\.cloudinary\.com\/s6cu3nwk\/image\/upload\/v\d+\/taa\/site\//)
  }
})
test("editor image field rejects off-account URLs and non-editorial Cloudinary paths",()=>{
  const good="https://res.cloudinary.com/s6cu3nwk/image/upload/v1795604620/taa/content/01234567-89ab-4cde-8f01-234567890abc.jpg"
  assert.equal(isCloudinaryEditorialImage(good),true)
  assert.equal(isApprovedArticleImage(good),true)
  assert.equal(isApprovedArticleImage("/images/homework-guide/taa-drawing-activity-enhanced.jpg"),true)
  for(const bad of ["https://evil.example/malware.jpg","https://res.cloudinary.com/other/image/upload/v1/taa/content/foo.jpg","https://res.cloudinary.com/s6cu3nwk/image/upload/v1/taa/site/brand/logo.png","javascript:alert(1)"]){
    assert.equal(isApprovedArticleImage(bad),false)
  }
})
