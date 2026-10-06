import { z } from "zod"

const optionalTrimmed = (max) => z.string().trim().max(max).optional().default("")
const stringList = z.array(z.string().trim().min(1).max(80)).max(12).optional().default([])

export const preconversionLeadEditSchema = z.object({
  parentLeadId: z.string().uuid(),
  childLeadId: z.string().uuid(),
  timetablePreferenceId: z.string().uuid(),
  parentName: z.string().trim().min(1).max(160),
  email: z.union([z.string().trim().email().max(254), z.literal("")]),
  phone: optionalTrimmed(50),
  area: optionalTrimmed(120),
  source: optionalTrimmed(120),
  childFirstName: z.string().trim().min(1).max(80),
  childAge: z.coerce.number().int().min(3).max(21),
  schoolName: optionalTrimmed(160),
  schoolYear: optionalTrimmed(80),
  curriculum: optionalTrimmed(120),
  supportNeeds: stringList,
  notes: optionalTrimmed(2000),
  courseOrExamBoard: optionalTrimmed(160),
  preferredDays: stringList,
  preferredTimes: stringList,
  preferredFrequency: optionalTrimmed(80),
})

export function canEditPreconversionChild({ learnerExists }) {
  return !learnerExists
}

const nullable = (value) => {
  const trimmed = typeof value === "string" ? value.trim() : value
  return trimmed === "" ? null : trimmed
}

export function buildPreconversionLeadUpdates(value) {
  return {
    parent: {
      parent_name: value.parentName.trim(),
      email: nullable(value.email),
      phone: nullable(value.phone),
      area: nullable(value.area),
      source: nullable(value.source),
    },
    child: {
      first_name: value.childFirstName.trim(),
      child_age: Number(value.childAge),
      school_name: nullable(value.schoolName),
      school_year: nullable(value.schoolYear),
      curriculum: nullable(value.curriculum),
      support_needs: value.supportNeeds || [],
      notes: nullable(value.notes),
      course_or_exam_board: nullable(value.courseOrExamBoard),
    },
    timetable: {
      preferred_days: value.preferredDays || [],
      preferred_times: value.preferredTimes || [],
      preferred_frequency: nullable(value.preferredFrequency),
    },
  }
}
