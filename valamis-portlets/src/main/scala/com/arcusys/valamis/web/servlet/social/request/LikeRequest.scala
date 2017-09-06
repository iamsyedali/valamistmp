package com.arcusys.valamis.web.servlet.social.request

import com.arcusys.learn.liferay.util.PortalUtilHelper
import com.arcusys.valamis.model.Order
import com.arcusys.valamis.social
import com.arcusys.valamis.social.model.{Like, LikeSortBy, LikeSortByCriteria}
import com.arcusys.valamis.web.servlet.request.{BaseRequest, Parameter}
import org.json4s.DefaultFormats
import org.scalatra.ScalatraServlet

import scala.util.Try

object LikeRequest extends BaseRequest {
  val Id = "id"
  val UserId = "userId"
  val SortByCriterion = "sortByCriterion"
  val SortOrder = "sortOrder"
  val ActivityId = "activityId"

  def apply(controller: ScalatraServlet) = new Model(controller)

  implicit val serializationFormats = DefaultFormats ++ org.json4s.ext.JodaTimeSerializers.all

  class Model(val controller: ScalatraServlet) {
    implicit val scalatra = controller

    def id = Parameter(Id).longRequired
    def userId = Parameter(UserId).longRequired
    def activityId = Parameter(ActivityId).longRequired
    def courseId = Parameter(CourseId).longRequired

    def like = Like(
      id = Parameter(Id).longOption,
      companyId =  PortalUtilHelper.getCompanyId(controller.request),
      userId = Parameter(UserId).longRequired,
      activityId = Parameter(ActivityId).longRequired)

    def likeFilter = social.model.LikeFilter(
      companyId =  PortalUtilHelper.getCompanyId(controller.request),
      userId = Parameter(UserId).longOption,
      activityId = Parameter(ActivityId).longOption,
      sortBy = Try {
        val sortByCriterion = LikeSortByCriteria.withName(Parameter(SortByCriterion).required)
        val sortOrder = Order.withName(Parameter(SortOrder).required)
        LikeSortBy(sortByCriterion, sortOrder)
      }.toOption
    )
  }
}