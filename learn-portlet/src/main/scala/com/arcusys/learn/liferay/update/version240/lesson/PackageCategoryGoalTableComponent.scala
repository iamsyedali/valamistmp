package com.arcusys.learn.liferay.update.version240.lesson

import com.arcusys.valamis.persistence.common.DbNameUtils._

import scala.slick.driver.JdbcProfile

trait PackageCategoryGoalTableComponent {
  protected val driver: JdbcProfile
  import driver.simple._

  type PackageCategoryGoal = (Long, String, String, Int, Option[Long])
  class PackageCategoryGoalTable(tag : Tag) extends Table[PackageCategoryGoal](tag, tblName("PACKAGE_CATEGORY_GOAL")) {
    def id = column[Long]("ID", O.PrimaryKey, O.AutoInc)
    def packageId = column[Long]("PACKAGE_ID")
    def name = column[String]("NAME")
    def category = column[String]("CATEGORY")
    def count = column[Int]("COUNT")

    def * = (packageId, name, category, count, id.?)
  }

  val packageCategoryGoals = TableQuery[PackageCategoryGoalTable]
}
