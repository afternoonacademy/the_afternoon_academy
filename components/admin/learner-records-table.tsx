"use client";

import Link from "next/link";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Learner = { id: string; first_name: string; year_group: string | null; current_school_name: string | null; status: string; created_at: string };
export function LearnerRecordsTable({ learners }: { learners: Learner[] }) {
  const columns: ColumnDef<Learner>[] = [
    { header: "Learner", cell: ({ row }) => <Link className="font-semibold hover:underline" href={`/admin/learners/${row.original.id}`}>{row.original.first_name}</Link> },
    { header: "Year group", cell: ({ row }) => row.original.year_group || "—" },
    { header: "School", cell: ({ row }) => <span className="text-muted-foreground">{row.original.current_school_name || "—"}</span> },
    { header: "Status", cell: ({ row }) => <Badge className="capitalize" variant={row.original.status === "active" ? "default" : "secondary"}>{row.original.status}</Badge> },
    { id: "open", header: () => <span className="sr-only">Open</span>, cell: ({ row }) => <div className="text-right"><Link className="text-sm font-semibold text-primary hover:underline" href={`/admin/learners/${row.original.id}`}>Open record</Link></div> },
  ];
  const table = useReactTable({ data: learners, columns, getCoreRowModel: getCoreRowModel() });
  return <><div className="hidden overflow-hidden rounded-xl border md:block"><Table><TableHeader>{table.getHeaderGroups().map((group) => <TableRow key={group.id}>{group.headers.map((header) => <TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>)}</TableRow>)}</TableHeader><TableBody>{table.getRowModel().rows.map((row) => <TableRow className="hover:bg-muted/40" key={row.id}>{row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>)}</TableBody></Table></div><div className="divide-y border-y md:hidden">{learners.map((learner) => <Link className="flex items-center justify-between gap-3 py-4" href={`/admin/learners/${learner.id}`} key={learner.id}><span><span className="block font-semibold">{learner.first_name}</span><span className="block text-sm text-muted-foreground">{learner.year_group || "Year group to confirm"}{learner.current_school_name ? ` · ${learner.current_school_name}` : ""}</span></span><Badge className="capitalize" variant={learner.status === "active" ? "default" : "secondary"}>{learner.status}</Badge></Link>)}</div></>;
}
