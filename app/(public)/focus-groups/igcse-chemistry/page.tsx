import type { Metadata } from "next"
import Link from "next/link"
import { Atom, BookOpenCheck, Calculator, MapPin, Users } from "lucide-react"
import { FocusGroupInterestForm } from "@/components/forms/focus-group-interest-form"
import { PublicFooter, PublicHeader } from "@/components/shared/public-shell"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "IGCSE Chemistry Focus Group in Madrid",
  description: "Small-group IGCSE Chemistry support for Years 10–11 in Arturo Soria, Madrid. Focused teaching, maximum six students, €40 per 50-minute session.",
  alternates: { canonical: "/focus-groups/igcse-chemistry" },
}

// This conversion page includes a server action. Render it at request time so
// the interest form is not evaluated during the static build.
export const dynamic = "force-dynamic"

const benefits = [
  [BookOpenCheck, "Current school Chemistry", "Bring the current unit, homework and questions. Sessions build secure understanding alongside school learning."],
  [Atom, "Concepts made clear", "Focused teaching for difficult ideas, subject vocabulary and the links between topics."],
  [Calculator, "Calculations and problem solving", "Practise applying ideas, explaining methods and working accurately through Chemistry problems."],
  [Users, "A deliberately matched group", "Up to six Years 10–11 students studying the same subject and qualification level."],
]

export default function IgcseChemistryFocusGroupPage() {
  return <main className="min-h-screen"><PublicHeader locale="en" switchHref="/es" /><div className="brand-shell space-y-14 py-10 md:py-16">
    <section className="brand-hero grid gap-8 p-6 md:p-10 lg:grid-cols-[1fr_340px] lg:items-center"><div className="space-y-6"><p className="brand-pill">New Focus Group · Years 10–11</p><div className="space-y-4"><h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">IGCSE Chemistry support in Madrid.</h1><p className="max-w-2xl text-lg brand-muted md:text-xl">A specialist, small-group Chemistry session for students who benefit from focused teaching alongside their British-curriculum studies.</p><p className="max-w-2xl brand-muted">This is an additional Academy group type, distinct from our Homework Club. We form each group carefully around age, stage and learning needs.</p></div><a className="brand-button" href="#register">Register interest in IGCSE Chemistry</a></div><Card className="brand-card border-[color:var(--brand-gold)] bg-[rgba(255,250,240,0.92)]"><CardContent className="space-y-4 p-7"><p className="brand-kicker">At a glance</p><p className="text-4xl font-bold">€40</p><p className="font-semibold">per 50-minute session</p><div className="space-y-2 border-y py-4 text-sm brand-muted"><p><strong className="text-foreground">Maximum 6 students</strong></p><p>17:00–17:50 or 18:00–18:50</p><p>Arturo Soria · Calle Asura</p></div><p className="text-sm brand-muted">Registering interest does not reserve or confirm a place.</p></CardContent></Card></section>
    <section className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]"><Card className="brand-card"><CardContent className="space-y-3 p-6"><p className="brand-kicker">What is a Focus Group?</p><h2 className="text-3xl font-bold tracking-tight">Subject-specific teaching in a small group.</h2></CardContent></Card><Card className="brand-card"><CardContent className="space-y-4 p-6 brand-muted"><p>Unlike the wider Homework Club, a Focus Group brings together students at a similar age and stage who are studying the same specialist subject. It gives a qualified subject teacher room to teach directly, respond to misconceptions and build confidence through carefully chosen practice.</p><p>It is designed for students following IGCSE or a comparable British-curriculum Chemistry course. We will discuss the student&apos;s current course and needs before confirming that the group is the right fit.</p></CardContent></Card></section>
    <section className="space-y-6"><div className="max-w-3xl space-y-3"><p className="brand-kicker">How we help</p><h2 className="text-3xl font-bold tracking-tight">Focused support that makes the next step clear.</h2><p className="brand-muted">Sessions can support consolidation, revision and appropriate exam preparation without making promises about grades or a particular examination board.</p></div><div className="grid gap-4 md:grid-cols-2">{benefits.map(([Icon,title,copy]) => <Card className="brand-card" key={title as string}><CardContent className="space-y-4 p-6"><Icon className="h-6 w-6" /><h3 className="text-xl font-semibold">{title as string}</h3><p className="text-sm brand-muted">{copy as string}</p></CardContent></Card>)}</div></section>
    <section className="grid gap-6 md:grid-cols-2"><Card className="brand-card"><CardContent className="space-y-3 p-6"><MapPin className="h-6 w-6" /><h2 className="text-2xl font-bold">Arturo Soria / Calle Asura</h2><p className="brand-muted">An English-speaking, calm learning environment for British and international school families across Madrid.</p><Link className="text-sm font-semibold underline" href="/location">See the location</Link></CardContent></Card><Card className="brand-card"><CardContent className="space-y-3 p-6"><Users className="h-6 w-6" /><h2 className="text-2xl font-bold">Who it is for</h2><p className="brand-muted">Years 10–11 students who are studying IGCSE or British-curriculum Chemistry and would benefit from a small, specialist group.</p></CardContent></Card></section>
    <section id="register" className="scroll-mt-10"><div className="mb-6 max-w-3xl"><p className="brand-kicker">Interest register</p><h2 className="mt-2 text-3xl font-bold tracking-tight">Tell us about the student and the best session.</h2><p className="mt-3 brand-muted">We will review demand, current course and timetable preference before inviting a family to discuss a suitable group.</p></div><FocusGroupInterestForm /></section>
  </div><PublicFooter locale="en" switchHref="/es" /></main>
}
