import { addMarketingPartner, setMarketingPartnerActive } from "@/actions/marketing-partners"
import { SaveActionForm } from "@/components/admin/save-action-form"
import { Input } from "@/components/ui/input"
import { freeTrialPaths } from "@/lib/leads/free-trial.mjs"
import { loadMarketingPartners } from "@/lib/leads/marketing-partners"

export async function MarketingPartners() {
  const { data: partners, error } = await loadMarketingPartners(true)

  return (
    <section className="brand-card max-w-4xl space-y-6 p-6">
      <div className="space-y-2">
        <h3 className="text-xl font-bold">Marketing</h3>
        <p className="text-sm text-muted-foreground">
          Add businesses and groups to the free first session form. Active names appear on the English and Spanish pages.
        </p>
      </div>
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">Free first session pages</h4>
        <ul className="space-y-2 text-sm">
          {([["English", freeTrialPaths.en], ["Español", freeTrialPaths.es]] as const).map(([label, path]) => (
            <li key={path}>
              <a href={path} target="_blank" rel="noopener noreferrer" className="inline-flex flex-wrap gap-x-2 underline underline-offset-4">
                <span>{label}</span>
                <span className="break-all text-muted-foreground">{path}</span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-muted-foreground">Partner choices are currently unavailable.</p>
      ) : (
        <>
          <SaveActionForm action={addMarketingPartner} submitLabel="Add partner" successMessage="Partner added">
            <label className="grid max-w-md gap-2 text-sm font-medium">
              Partner name
              <Input name="name" maxLength={90} required />
            </label>
          </SaveActionForm>
          {partners?.length ? (
            <ul className="divide-y rounded-lg border">
              {partners.map((partner) => (
                <li key={partner.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">{partner.name}</p>
                    <p className="text-sm text-muted-foreground">{partner.active ? "Active" : "Hidden"}</p>
                  </div>
                  <SaveActionForm
                    action={setMarketingPartnerActive}
                    submitLabel={partner.active ? "Hide" : "Restore"}
                    successMessage={partner.active ? "Partner hidden" : "Partner restored"}
                  >
                    <input type="hidden" name="id" value={partner.id} />
                    <input type="hidden" name="active" value={String(!partner.active)} />
                  </SaveActionForm>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No partners have been added.</p>
          )}
        </>
      )}
    </section>
  )
}
