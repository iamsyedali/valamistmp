package com.arcusys.valamis.questionbank.model

import org.scalatest.{ FlatSpec, Matchers }

class QuestionCategoryTest extends FlatSpec with Matchers {
  "Question bank question category entity" can "be constructed" in {
    val category = new QuestionCategory(1, "t", "d", Some(12), Some(0))
    category.id should equal(1)
    category.title should equal("t")
    category.description should equal("d")
    category.parentId should equal(Some(12))
  }
  it can "be constructed with empty parent" in {
    val category = new QuestionCategory(1, "t", "d", None, Some(0))
    category.id should equal(1)
    category.title should equal("t")
    category.description should equal("d")
    category.parentId should equal(None)
  }

}
