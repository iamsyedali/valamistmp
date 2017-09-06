package com.arcusys.valamis.lesson.scorm.service.parser

import com.arcusys.valamis.lesson.scorm.model.manifest._
import com.arcusys.valamis.util.XMLImplicits
import com.arcusys.valamis.util.XMLImplicits._

import scala.xml.Elem

class SequencingRuleParser(sequencingRuleElement: Elem) {
  def parseSequencingRule = {
    val ruleConditionsElement = sequencingRuleElement childElem ("imsss", "ruleConditions") required element
    val conditionCombination = ruleConditionsElement attr "conditionCombination" withDefault (ConditionCombination, ConditionCombination.All)
    val conditions = ruleConditionsElement children ("imsss", "ruleCondition") map parseSequencingRuleCondition
    val action = sequencingRuleElement childElem ("imsss", "ruleAction") required element attr "action" required string
    (new RuleConditionSet(conditions, conditionCombination), action)
  }

  def parsePreConditionRule = {
    val (conditions, action) = parseSequencingRule
    new PreConditionRule(conditions, PreConditionAction.withName(action))
  }

  def parsePostConditionRule = {
    val (conditions, action) = parseSequencingRule
    new PostConditionRule(conditions, PostConditionAction.withName(action))
  }

  def parseExitConditionRule = {
    val (conditions, action) = parseSequencingRule
    if (action != "exit") throw new SCORMParserException("Invalid value of 'action' attribute for exit condition: " + action)
    new ExitConditionRule(conditions)
  }
}