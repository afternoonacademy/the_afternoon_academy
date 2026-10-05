export const plannedPlaceTemplateContract = {
  key: "planned_place_offer",
  defaultSubject: "Planned Academy place for {{child_name}}",
  defaultBody:
    "Hello {{parent_name}},\n\nWe hope you are well.\n\n{{period_heading}}\n\n{{service_dates}}\n\nThat is {{session_count}} session(s), totalling {{amount_due}}.\n\nIf you would like to take the place, please make your bank transfer.\n\n{{payment_details}}\n\nPayment reference: {{payment_reference}}\n\nWarmly,\nThe Afternoon Academy",
  placeholders: [
    { key: "parent_name", description: "Parent / guardian name" },
    { key: "child_name", description: "Child name" },
    {
      key: "period_heading",
      description: "Child-specific first-period heading",
    },
    {
      key: "service_dates",
      description:
        "Grouped session name plus each agreed date and start time. Pre-agreed first-period exceptions are shown as normal dates.",
    },
    { key: "session_count", description: "Number of sessions in the period" },
    { key: "amount_due", description: "Total amount due for the period" },
    {
      key: "payment_details",
      description: "Business/account name and IBAN only",
    },
    {
      key: "payment_reference",
      description: "Child name plus covered month/year",
    },
    {
      key: "recurring_place",
      description: "Legacy recurring-place summary; supported for existing custom templates",
    },
    {
      key: "price_plan_name",
      description: "Legacy price-plan name; supported for existing custom templates",
    },
    {
      key: "session_price",
      description: "Legacy per-session price; supported for existing custom templates",
    },
  ],
}

export const renewalTemplateContract = {
  key: "renewal_reminder",
  defaultSubject: "Renewal for {{learner_names}} at The Afternoon Academy",
  defaultBody:
    "Hello {{parent_name}},\n\nWe hope you are well.\n\n{{period_heading}}\n\n{{service_dates}}\n\nThat is {{session_count}} session(s), totalling {{amount_due}}.\n\nIf you would like to continue, please make your usual bank transfer.\n\n{{payment_details}}\n\nPayment reference: {{payment_reference}}\n\nWarmly,\nThe Afternoon Academy",
  placeholders: [
    { key: "parent_name", description: "Parent / guardian name" },
    { key: "learner_names", description: "Learner name(s)" },
    {
      key: "period_heading",
      description: "Learner-specific next-period heading",
    },
    {
      key: "service_dates",
      description:
        "Grouped session name plus each date and start time. Genuine renewal replacements are labelled replacement.",
    },
    { key: "session_count", description: "Number of sessions in the period" },
    { key: "amount_due", description: "Total amount due for the period" },
    {
      key: "payment_details",
      description: "Business/account name and IBAN only",
    },
    {
      key: "payment_reference",
      description: "Learner name plus covered month/year",
    },
  ],
}

export function buildPaymentDetails({
  businessName,
  accountName,
  iban,
}) {
  return [
    businessName ? "Business name: " + businessName : null,
    accountName ? "Account name: " + accountName : null,
    iban ? "IBAN: " + iban : null,
  ]
    .filter(Boolean)
    .join("\n")
}
