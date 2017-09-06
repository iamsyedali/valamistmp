package com.arcusys.valamis.lesson.scorm.model.manifest

import com.arcusys.valamis.util.CollectionExtensions._

/**
 * Rule describing how this activity's statuses are rolled up from child activity statuses
 * @param childActivitySet      What child activities are to meet the rule conditions
 * @param action                Rule action
 * @param conditions            Rule condition set
 */
class RollupRule(
    val childActivitySet: ChildActivitySet,
    val conditions: RuleConditionSet,
    val action: RollupAction.Value) {
  import ConditionType._
  def validConditionType(condition: ConditionRuleItem) = condition.conditionType noneOf (ObjectiveMeasureGreaterThan, ObjectiveMeasureLessThan, Always)
  require(conditions.conditions forall validConditionType)
}