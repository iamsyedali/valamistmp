package com.arcusys.learn.liferay.update.version240.certificate

import com.arcusys.valamis.model.PeriodTypes
import com.arcusys.valamis.persistence.common.DbNameUtils._
import com.arcusys.valamis.persistence.common.SlickProfile

trait CourseGoalTableComponent extends CertificateTableComponent{ self: SlickProfile =>
  import driver.simple._

  type CourseGoal = (Long, Long, Int, PeriodTypes.Value, Int)
  class CourseGoalTable(tag: Tag) extends Table[CourseGoal](tag, tblName("CERT_COURSE_GOAL")) {
    implicit val ValidPeriodTypeMapper = MappedColumnType.base[PeriodTypes.PeriodType, String](
      s => s.toString,
      s => PeriodTypes.withName(s)
    )

    def certificateId = column[Long]("CERTIFICATE_ID")
    def courseId = column[Long]("COURSE_ID")
    def periodValue = column[Int]("PERIOD_VALUE")
    def periodType = column[PeriodTypes.PeriodType]("PERIOD_TPE")
    def arrangementIndex = column[Int]("ARRANGEMENT_INDEX")

    def * = (certificateId, courseId, periodValue, periodType, arrangementIndex)

    def PK = primaryKey(pkName("CERT_COURSE_GOAL"), (certificateId, courseId))
    def certificateFK = foreignKey(fkName("CERT_COURSE_GOAL_TO_CERT"), certificateId, certificates)(x => x.id, onDelete = ForeignKeyAction.Cascade)
  }

  val courseGoals = TableQuery[CourseGoalTable]
}