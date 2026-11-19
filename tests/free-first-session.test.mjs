import test from "node:test"
import assert from "node:assert/strict"
import { freeTrialLeadSource, isFreeTrialSupport, referralChoices } from "../lib/leads/free-trial.mjs"

test("the Scout choice remains referral attribution and does not determine eligibility", () => {
  assert.equal(freeTrialLeadSource("scout-proel-334"), "Free first session · Scout Proel 334")
  assert.equal(freeTrialLeadSource("google"), "Free first session · Google Search or Maps")
  assert.equal(new Set(referralChoices.map(({ value }) => value)).size, referralChoices.length)
  assert.equal(isFreeTrialSupport("homework_help"), true)
  assert.equal(isFreeTrialSupport("igcse_chemistry"), false)
  assert.equal(isFreeTrialSupport("one_to_one"), false)
})

test("missing and arbitrary referral values never become stored campaign labels", () => {
  for (const value of [null, "", "unapproved value", new Blob()]) {
    assert.equal(freeTrialLeadSource(value), "Free first session")
  }
})
