import test from "node:test"
import assert from "node:assert/strict"
import { freeTrialLeadSource, isFreeTrialSupport, referralChoices } from "../lib/leads/free-trial.mjs"

test("the default referral choices contain generic channels and no named partners", () => {
  assert.equal(freeTrialLeadSource("scout-proel-334"), null)
  assert.equal(freeTrialLeadSource("google"), "Free first session · Google Search or Maps")
  assert.equal(new Set(referralChoices.map(({ value }) => value)).size, referralChoices.length)
  assert.equal(isFreeTrialSupport("homework_help"), true)
  assert.equal(isFreeTrialSupport("igcse_chemistry"), false)
  assert.equal(isFreeTrialSupport("one_to_one"), false)
})

test("missing and arbitrary referral values never become stored campaign labels", () => {
  for (const value of [null, "", "unapproved value", new Blob()]) {
    assert.equal(freeTrialLeadSource(value), null)
  }
})
