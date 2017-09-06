package com.arcusys.learn.liferay.update.version260.certificate

import com.arcusys.learn.liferay.update.version240.certificate.CertificateTableComponent
import com.arcusys.valamis.model.PeriodTypes
import com.arcusys.valamis.persistence.common.DbNameUtils._
import com.arcusys.valamis.persistence.common.SlickProfile

trait StatementGoalTableComponent extends CertificateTableComponent { self: SlickProfile =>
  import driver.simple._

  type StatementGoal = (Long, String, String, Int, PeriodTypes.Value)
  class StatementGoalTable(tag: Tag) extends Table[StatementGoal](tag, tblName("CERT_STATEMENT_GOAL")) {
    implicit val ValidPeriodTypeMapper = MappedColumnType.base[PeriodTypes.PeriodType, String](
      s => s.toString,
      s => PeriodTypes.withName(s)
    )

    def certificateId = column[Long]("CERTIFICATE_ID")
    def verb = column[String]("VERB")
    def obj = column[String]("OBJ")
    def periodValue = column[Int]("PERIOD_VALUE")
    def periodType = column[PeriodTypes.PeriodType]("PERIOD_TPE")

    def * = (certificateId, verb, obj, periodValue, periodType)

    def PK = primaryKey(pkName("CERT_STATEMENT_GOAL"), (certificateId, verb, obj))
    def certificateFK = foreignKey(fkName("CERT_STATEMENT_GOAL_TO_CERT"), certificateId, certificates)(x => x.id, onDelete = ForeignKeyAction.Cascade)
  }

  val statementGoals = TableQuery[StatementGoalTable]
}