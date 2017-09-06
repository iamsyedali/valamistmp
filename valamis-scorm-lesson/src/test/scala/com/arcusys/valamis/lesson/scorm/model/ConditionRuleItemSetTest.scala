package com.arcusys.valamis.lesson.scorm.model

import com.arcusys.valamis.lesson.scorm.model.manifest._
import org.scalatest.FlatSpec
import org.scalatest.matchers.ShouldMatchers

class ConditionRuleItemSetTest extends FlatSpec with ShouldMatchers {
  val condition1 = new ConditionRuleItem(ConditionType.ActivityAttempted)
  val condition2 = new ConditionRuleItem(ConditionType.ObjectiveStatusKnown)
  val conditions = Seq(condition1, condition2)

  "Rule condition set" can "be costructed" in {
    val set = new RuleConditionSet(conditions, ConditionCombination.All)
    set.conditions should equal(conditions)
    set.combination should equal(ConditionCombination.All)
  }

  it should "not accept empty condition collection" in {
    intercept[IllegalArgumentException] {
      new RuleConditionSet(Nil, ConditionCombination.All)
    }
  }

  it can "be constructed with 'all' helper" in {
    val set = RuleConditionSet.allOf(condition1, condition2)
    set.conditions should equal(conditions)
    set.combination should equal(ConditionCombination.All)
  }

  it can "be constructed with 'any' helper" in {
    val set = RuleConditionSet.anyOf(condition1, condition2)
    set.conditions should equal(conditions)
    set.combination should equal(ConditionCombination.Any)
  }

  it can "be constructed with 'single' helper" in {
    val set = RuleConditionSet(condition1)
    set.conditions should equal(Seq(condition1))
    set.combination should equal(ConditionCombination.Any)
  }
}
