"use client";

import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useState } from "react";

import { ManualEnrolmentForm } from "@/components/admin/manual-enrolment-form";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Child = { id: string; first_name: string | null; child_age: number | null; school_year: string | null };
type Slot = { id: string; weekday: number; table_number: number; academy_table_id: string; starts_at: string; duration_minutes: number };
type TakenSeat = { key: string; childName: string };
export type PaymentFamily = { id: string; parent_name: string; email: string; status: string; children: Child[] };

export function PaymentActivationTable({ families, slots, takenSeats, seatCapacities }: { families: PaymentFamily[]; slots: Slot[]; takenSeats: TakenSeat[]; seatCapacities: Record<string, number> }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const columns: ColumnDef<PaymentFamily>[] = [
    { header: "Family", cell: ({ row }) => <div><p className="font-semibold">{row.original.parent_name}</p><p className="text-xs text-muted-foreground">{row.original.email}</p></div> },
    { header: "Children", cell: ({ row }) => row.original.children.map((child) => child.first_name || "Child").join(", ") || "—" },
    { header: "Stage", cell: ({ row }) => <span className="capitalize text-muted-foreground">{row.original.status.replaceAll("_", " ")}</span> },
    { id: "activate", header: () => <span className="sr-only">Activate</span>, cell: ({ row }) => <div className="text-right"><Button onClick={() => setExpanded(expanded === row.original.id ? null : row.original.id)} size="sm" type="button" variant={expanded === row.original.id ? "secondary" : "outline"}>{expanded === row.original.id ? "Close" : "Add payment & seat"}</Button></div> },
  ];
  const table = useReactTable({ data: families, columns, getCoreRowModel: getCoreRowModel() });
  if (!families.length) return <p className="py-6 text-sm text-muted-foreground">No active family leads yet.</p>;
  return <><div className="hidden overflow-hidden rounded-xl border md:block"><Table><TableHeader>{table.getHeaderGroups().map((group) => <TableRow key={group.id}>{group.headers.map((header) => <TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>)}</TableRow>)}</TableHeader><TableBody>{table.getRowModel().rows.map((row) => <><TableRow className="hover:bg-muted/40" key={row.id}>{row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>{expanded === row.original.id ? <TableRow key={`${row.id}-form`}><TableCell className="bg-muted/20 p-5" colSpan={columns.length}><ManualEnrolmentForm childOptions={row.original.children} parentLeadId={row.original.id} seatCapacities={seatCapacities} slots={slots} takenSeats={takenSeats} /></TableCell></TableRow> : null}</>)}</TableBody></Table></div><div className="divide-y border-y md:hidden">{families.map((family) => <div className="py-4" key={family.id}><button className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setExpanded(expanded === family.id ? null : family.id)} type="button"><span><span className="block font-semibold">{family.parent_name}</span><span className="block text-sm text-muted-foreground">{family.children.map((child) => child.first_name || "Child").join(", ")}</span></span><span className="text-sm font-semibold text-primary">{expanded === family.id ? "Close" : "Payment & seat"}</span></button>{expanded === family.id ? <div className="mt-4 border-t pt-4"><ManualEnrolmentForm childOptions={family.children} parentLeadId={family.id} seatCapacities={seatCapacities} slots={slots} takenSeats={takenSeats} /></div> : null}</div>)}</div></>;
}
