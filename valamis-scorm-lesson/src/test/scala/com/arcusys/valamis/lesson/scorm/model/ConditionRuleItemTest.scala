package com.arcusys.valamis.lesson.scorm.model

import com.arcusys.valamis.lesson.scorm.model.manifest.{ ConditionType, ConditionRuleItem }
import org.scalatest.FlatSpec
import org.scalatest.matchers.ShouldMatchers

class ConditionRuleItemTest extends FlatSpec with ShouldMatchers {
  "Rule condition entity" can "be constructed for measure-based condition type" in {
    val condition = new ConditionRuleItem(ConditionType.ObjectiveMeasureGreaterThan, Some("OBJECTIVE_ID"), Some(BigDecimal("0.7")), inverse = true)
    condition.conditionType should equal(ConditionType.ObjectiveMeasureGreaterThan)
    condition.objectiveId should equal(Some("OBJECTIVE_ID"))
    condition.measureThreshold should equal(Some(BigDecimal("0.7")))
    condition.inverse should equal(true)
  }
  it can "be constructed with inverse default false" in {
    val condition = new ConditionRuleItem(ConditionType.ObjectiveMeasureGreaterThan, Some("OBJECTIVE_ID"), Some(BigDecimal("0.7")))
    condition.conditionType should equal(ConditionType.ObjectiveMeasureGreaterThan)
    condition.objectiveId should equal(Some("OBJECTIVE_ID"))
    condition.measureThreshold should equal(Some(BigDecimal("0.7")))
    condition.inverse should equal(false)
  }
  it can "be constructed for non-measure-based objective-targeting condition type with threshold default None" in {
    val condition = new ConditionRuleItem(ConditionType.ObjectiveMeasureKnown, Some("OBJECTIVE_ID"))
    condition.conditionType should equal(ConditionType.ObjectiveMeasureKnown)
    condition.objectiveId should equal(Some("OBJECTIVE_ID"))
    condition.measureThreshold should equal(None)
    condition.inverse should equal(false)
  }
  it can "be constructed for non-objective-targeting condition type with target default None" in {
    val condition = new ConditionRuleItem(ConditionType.ActivityAttempted)
    condition.conditionType should equal(ConditionType.ActivityAttempted)
    condition.objectiveId should equal(None)
    condition.measureThreshold should equal(None)
    condition.inverse should equal(false)
  }
  it should "not accept threshold > 1" in {
    intercept[IllegalArgumentException] {
      new ConditionRuleItem(ConditionType.ObjectiveMeasureGreaterThan, Some("OBJECTIVE_ID"), Some(BigDecimal("1.1")))
    }
  }

  it should "accept threshold == 1" in {
    val condition = new ConditionRuleItem(ConditionType.ObjectiveMeasureGreaterThan, Some("OBJECTIVE_ID"), Some(BigDecimal("1")))
    condition.measureThreshold should equal(Some(BigDecimal("1")))
  }

  it should "accept threshold == 0" in {
    val condition = new ConditionRuleItem(ConditionType.ObjectiveMeasureGreaterThan, Some("OBJECTIVE_ID"), Some(BigDecimal("0")))
    condition.measureThreshold should equal(Some(BigDecimal("0")))
  }

  it should "accept threshold == -1" in {
    val condition = new ConditionRuleItem(ConditionType.ObjectiveMeasureGreaterThan, Some("OBJECTIVE_ID"), Some(BigDecimal("-1")))
    condition.measureThreshold should equal(Some(BigDecimal("-1")))
  }

  it should "not accept threshold < -1" in {
    intercept[IllegalArgumentException] {
      new ConditionRuleItem(ConditionType.ObjectiveMeasureGreaterThan, Some("OBJECTIVE_ID"), Some(BigDecimal("-1.01")))
    }
  }

  it should "not accept threshold for non-measure-based condition type" in {
    intercept[IllegalArgumentException] {
      new ConditionRuleItem(ConditionType.ActivityAttempted, Some("OBJECTIVE_ID"), Some(BigDecimal("-1.01")))
    }
  }

  it should "require threshold for measure-based condition type" in {
    intercept[IllegalArgumentException] {
      new ConditionRuleItem(ConditionType.ObjectiveMeasureGreaterThan, Some("OBJECTIVE_ID"), None)
    }
  }

  /*it should "not accept objective for non-objective-targeting type" in {
    intercept[IllegalArgumentException] {
      new RuleCondition(ConditionType.ActivityAttempted, Some("OBJECTIVE_ID"), None)
    }
  }*/
}
