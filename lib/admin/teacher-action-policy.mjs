export const teacherSafeActionCapabilities = {
  updateLearnerPersonalProfile: "edit_learning_record",
  recordRenewalExpectedAttendance: "operate_sessions",
  recordAttendance: "operate_sessions",
  createTeacherUpdate: "edit_learning_record",
  createLearnerGoal: "edit_learning_record",
  updateLearnerGoalStatus: "edit_learning_record",
  recordLearnerGoalProgress: "edit_learning_record",
  addDeliverySeat: "operate_sessions",
  addAdhocDeliverySeat: "operate_sessions",
  saveAdhocDeliverySession: "operate_sessions",
  updateDailyDeliverySession: "operate_sessions",
}

export function capabilityForTeachingAction(actionName) {
  return teacherSafeActionCapabilities[actionName] || null
}
