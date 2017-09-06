package com.arcusys.valamis.utils

import com.arcusys.learn.liferay.LiferayClasses._
import com.arcusys.learn.liferay.util.PortalUtilHelper
import com.arcusys.valamis.lrs.tincan._
import com.arcusys.valamis.lrssupport.lrs.service.util.TinCanVerbs
/**
 * Helper function for tincan data processing
 */
object TincanHelper {
  val EMAIL_PREFIX = "mailto:"

  @deprecated
  def getAgentByEmail(email: String) = {
    Agent(mBox = Option(EMAIL_PREFIX + email))
  }

  implicit class TincanAgent(user: LUser) {
    def getAgentByUuid = {
      val url = PortalUtilHelper.getHostName(user.getCompanyId)
      val account = Account(url, user.getUuid)
      Agent(name = Option(user.getFullName), account = Option(account))
    }
  }

  @deprecated
  def getAgent(fullName: String, emailAddress: String) = {
    Agent(name = Option(fullName), mBox = Option(EMAIL_PREFIX + emailAddress))
  }

  def isVerbType(verb: Verb, verbType: String) = verb.id.equalsIgnoreCase(TinCanVerbs.getVerbURI(verbType))

  def getScoreRaw(statement: Statement): Option[Int] = statement.result.map(res => res.score.map(_.raw)).flatten.flatten.map(_.toInt)

  def getScoreScaled(statement: Statement): Option[Float] = statement.result.flatMap(res => res.score.map(_.scaled)).flatten

  def getResultResponse(statement: Statement): Option[String] = statement.result.map(res => res.response).flatten

  def isActivityActorWithEmail(statement: Statement, email: String) = statement.obj.isInstanceOf[Agent] &&
    statement.obj.asInstanceOf[Agent].mBox.exists((EMAIL_PREFIX + email).equalsIgnoreCase)

  def isActivityWithId(statement: Statement, activityId: String) = statement.obj.isInstanceOf[Activity] &&
    statement.obj.asInstanceOf[Activity].id != null &&
    statement.obj.asInstanceOf[Activity].id.equalsIgnoreCase(activityId)

  def isActorWithEmail(statement: Statement, email: String) = statement.actor.isInstanceOf[Agent] &&
    statement.actor.asInstanceOf[Agent].mBox.exists(_.equalsIgnoreCase(EMAIL_PREFIX + email))

  def isContextCategoryContainsId(statement: Statement, categoryId: String) = statement.context.map(ctx =>
    ctx.contextActivities.map(ctxAct => ctxAct.category.size == 0 || ctxAct.category.exists(_.id.equalsIgnoreCase(categoryId)))
  )
    .flatten
    .getOrElse(false)

  def isContextGroupingContainsId(statement: Statement, activityId: String) = statement.context.map(ctx =>
    ctx.contextActivities.map(ctxAct => ctxAct.grouping.exists(_.id.equalsIgnoreCase(activityId)))
  )
    .flatten
    .getOrElse(false)
}

