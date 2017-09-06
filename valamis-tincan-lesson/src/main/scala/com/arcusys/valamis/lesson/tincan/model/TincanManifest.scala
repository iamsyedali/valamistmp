package com.arcusys.valamis.lesson.tincan.model

import com.arcusys.valamis.lesson.model.{BaseManifest, LessonType}
import com.arcusys.valamis.lesson.model.LessonType.LessonType
import com.arcusys.valamis.model.PeriodTypes
import com.arcusys.valamis.model.PeriodTypes.PeriodType
import org.joda.time.DateTime

@deprecated
case class TincanManifest(
    id: Long,
    title: String,
    summary: Option[String],
    courseId: Option[Int],

    visibility: Option[Boolean] = None,
    logo: Option[String] = None,
    isDefault: Boolean,
    passingLimit: Int = 0,
    rerunInterval: Int = 0,
    rerunIntervalType: PeriodType = PeriodTypes.UNLIMITED,
    beginDate: Option[DateTime],
    endDate: Option[DateTime],
    content: Option[String] = None) extends BaseManifest {
    def getType: LessonType = LessonType.Tincan
}
