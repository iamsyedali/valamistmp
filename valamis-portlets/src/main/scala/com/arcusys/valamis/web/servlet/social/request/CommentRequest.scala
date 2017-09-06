package com.arcusys.valamis.web.servlet.social.request

import com.arcusys.learn.liferay.util.PortalUtilHelper
import com.arcusys.valamis.model.{Order, SkipTake}
import com.arcusys.valamis.social
import com.arcusys.valamis.social.model.{Comment, CommentSortBy, CommentSortByCriteria}
import com.arcusys.valamis.web.servlet.request.{BaseRequest, Parameter}
import org.json4s.DefaultFormats
import org.scalatra.ScalatraServlet

object CommentRequest extends BaseRequest {
  val Id = "id"
  val UserId = "userId"
  val SortByCriterion = "sortByCriterion"
  val SortOrder = "sortOrder"
  val Subject = "subject"
  val ActivityId = "activityId"
  val Content = "content"
  val Arrangement = "arrangement"
  val Skip = "skip"
  val Take = "take"

  def apply(controller: ScalatraServlet) = new Model(controller)

  implicit val serializationFormats = DefaultFormats ++ org.json4s.ext.JodaTimeSerializers.all

  class Model(val controller: ScalatraServlet) {
    implicit val scalatra = controller
    def action = Parameter(Action).required

    def id = Parameter(Id).longRequired
    def userId = Parameter(UserId).longRequired
    def content = Parameter(Content).required
    def subject = Parameter(Subject).required
    def activityId = Parameter(ActivityId).longRequired
    def courseId = Parameter(CourseId).longRequired

    def comment = Comment(
      PortalUtilHelper.getCompanyId(controller.request),
      userId,
      content,
      activityId)

    def commentFilter = social.model.CommentFilter(
      companyId =  PortalUtilHelper.getCompanyId(controller.request),
      userId = Parameter(UserId).longOption,
      activityId = Parameter(ActivityId).longOption,
      sortBy = {
        val sortByCriterion =
          Parameter(SortByCriterion).option
            .map(CommentSortByCriteria.withName)
            .getOrElse(CommentSortByCriteria.CreationDate)
        val sortOrder =
          Parameter(SortOrder).option
            .map(Order.withName)
            .getOrElse(Order.Desc)
        Some(CommentSortBy(sortByCriterion, sortOrder))
      },
      skipTake = {
        val skip = Parameter(Skip).intOption
        val take = Parameter(Take).intOption

        if (skip.isEmpty || take.isEmpty) None
        else Some(SkipTake(skip.get, take.get))
      }
    )
  }
}