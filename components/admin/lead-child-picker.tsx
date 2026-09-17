"use client"

import { useMemo, useState } from "react"

type ParentLead = { id: string; parent_name: string }
type ChildLead = { id: string; parent_lead_id: string; first_name: string | null; school_year: string | null }

export function LeadChildPicker({
  parents,
  children,
}: {
  parents: ParentLead[]
  children: ChildLead[]
}) {
  const [parentId, setParentId] = useState("")
  const availableChildren = useMemo(
    () => children.filter((child) => child.parent_lead_id === parentId),
    [children, parentId]
  )

  return (
    <>
      <select
        className="h-10 rounded-md border bg-background px-3"
        name="parentLeadId"
        onChange={(event) => setParentId(event.target.value)}
        required
        value={parentId}
      >
        <option value="">Parent lead</option>
        {parents.map((parent) => <option key={parent.id} value={parent.id}>{parent.parent_name}</option>)}
      </select>
      <select
        className="h-10 rounded-md border bg-background px-3"
        disabled={!parentId}
        name="childLeadId"
        required
      >
        <option value="">{parentId ? "Choose this parent’s child" : "Choose parent first"}</option>
        {availableChildren.map((child) => <option key={child.id} value={child.id}>{child.first_name || "Child"}{child.school_year ? ` · ${child.school_year}` : ""}</option>)}
      </select>
    </>
  )
}