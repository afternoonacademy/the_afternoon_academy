import test from "node:test"
import assert from "node:assert/strict"
import {contentPublicId,isManagedContentId,eligibleOrphans,MIN_ORPHAN_AGE_MS} from "../lib/media/content-orphan-policy.mjs"

const now=Date.parse("2026-12-10T12:00:00Z")
const a="taa/content/4cb7a053-8fbb-47e4-96ec-1e53dd4bf1fd"
const b="taa/content/1caadfe2-fbae-44ad-b125-624a29019207"
const asset=(id,created_at)=>({public_id:id,created_at,type:"upload",resource_type:"image"})
const url=id=>"https://res.cloudinary.com/s6cu3nwk/image/upload/v1795607340/"+id+".png"
test("only content UUID assets qualify",()=>{
  assert.equal(isManagedContentId(a),true)
  assert.equal(isManagedContentId("taa/site/brand/logo"),false)
  assert.equal(isManagedContentId("taa/content/not-valid"),false)
  assert.equal(contentPublicId(url(a)),a)
})
test("referenced drafts and published images are never eligible",()=>{
  const assets=[asset(a,"2026-11-25T11:49:00Z"),asset(b,"2026-11-25T11:34:05Z")]
  assert.deepEqual(eligibleOrphans(assets,[url(a)],now).map(x=>x.public_id),[b])
})
test("seven-day grace period protects recent unsaved uploads",()=>{
  assert.deepEqual(eligibleOrphans([asset(b,new Date(now-MIN_ORPHAN_AGE_MS+1).toISOString())],[],now),[])
})
test("missing dates, untrusted folder and unreadable references fail closed",()=>{
  assert.deepEqual(eligibleOrphans([asset(b,"invalid"),asset("taa/site/logo","2025-01-01")],[],now),[])
})
