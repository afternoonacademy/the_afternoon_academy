export function EmailTemplatePlaceholderHelp({
  placeholders,
}: {
  placeholders: Array<{ key: string; description: string }>
}) {
  return (
    <div className="space-y-2 rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
      <p className="font-semibold text-foreground">Available placeholders</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {placeholders.map((item) => (
          <div key={item.key}>
            <code className="font-semibold text-foreground">
              {"{{" + item.key + "}}"}
            </code>
            <span>{" — " + item.description}</span>
          </div>
        ))}
      </div>
      <p>
        Session times are included inside <code>{"{{service_dates}}"}</code>.
      </p>
    </div>
  )
}
