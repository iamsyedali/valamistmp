package com.arcusys.valamis.web.servlet.grade.response

/**
 * Created by Iliya Tryapitsin on 17.04.2014.
 */
case class PackageGradeResponse(id: Long,
  packageLogo: String,
  packageName: String,
  description: String,
  finished: Boolean,
  grade: String,
  gradeAuto: String,
  activityId: String,
  statements: String,
  comment: String = "")
