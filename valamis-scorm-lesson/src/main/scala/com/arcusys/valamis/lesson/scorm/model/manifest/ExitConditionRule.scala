package com.arcusys.valamis.lesson.scorm.model.manifest

/**
 * A rule executed each time after an attempt on a descendant activity terminates to see if this activity needs to exit
 * @param conditions  Set of conditions that define whether the rule will be applied or not
 */
class ExitConditionRule(conditions: RuleConditionSet) extends ConditionRule(conditions)