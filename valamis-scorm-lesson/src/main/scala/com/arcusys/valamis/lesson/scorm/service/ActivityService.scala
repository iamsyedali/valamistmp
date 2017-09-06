package com.arcusys.valamis.lesson.scorm.service

import com.arcusys.learn.liferay.services.UserLocalServiceHelper
import com.arcusys.valamis.lesson.scorm.model.ScormUser
import com.arcusys.valamis.lesson.scorm.model.manifest._
import com.arcusys.valamis.lesson.scorm.model.tracking.{ActivityStateTree, Attempt}
import com.arcusys.valamis.lesson.scorm.storage.tracking.{ActivityStateTreeStorage, AttemptStorage}
import com.arcusys.valamis.lesson.scorm.storage.{ActivityStorage, ResourcesStorage, ScormUserStorage}
import com.escalatesoft.subcut.inject.{BindingModule, Injectable}

// TODO refactor
class ActivityService(implicit val bindingModule: BindingModule) extends Injectable with ActivityServiceContract {

  private val activityRepository = inject[ActivityStorage]
  private val resourceRepository = inject[ResourcesStorage]
  private val attemptStorage = inject[AttemptStorage]
  private val scormUserStorage = inject[ScormUserStorage]
  private val activityStateTreeStorage = inject[ActivityStateTreeStorage]

  override def getActivity(packageId: Int, activityId: String): Activity = {
    activityRepository.get(packageId, activityId).getOrElse(throw new Exception("activity ot found, packageId: " + packageId + " activityId:" + activityId))
  }

  override def getActivityOption(packageId: Int, activityId: String): Option[Activity] = {
    activityRepository.get(packageId, activityId)
  }

  override def getAllOrganizations(packageId: Int): Seq[Organization] = {
    activityRepository.getAllOrganizations(packageId)
  }

  override def getResource(packageId: Int, resourceIdentifier: String): Resource = {
    resourceRepository.getByID(packageId, resourceIdentifier).get
  }

  override def getActiveAttempt(userId: Int, packageId: Int, organizationId: String): Attempt = {
    attemptStorage.getActive(userId, packageId) match {
      case Some(attempt) => attempt
      case None =>
        val name = UserLocalServiceHelper().fetchUser(userId).map(_.getFullName).getOrElse("Anonymous")
        if (scormUserStorage.getById(userId).isEmpty) scormUserStorage.add(ScormUser(userId, name))
        attemptStorage.createAndGetID(userId, packageId, organizationId)
        attemptStorage.getActive(userId, packageId).get
    }
  }

  override def getLastAttempltOption(userId: Int, packageId: Int): Option[Attempt] = {
    attemptStorage.getLast(userId, packageId)
  }

  override def markAsComplete(attemptId: Int): Unit = {
    attemptStorage.markAsComplete(attemptId)
  }

  override def getActivityStateTreeForAttemptOption(attempt: Attempt): Option[ActivityStateTree] = {
    activityStateTreeStorage.get(attempt.id)
  }

  override def createActivityStateTreeForAttempt(attempt: Attempt): ActivityStateTree = {
    val stateTree = ActivityStateTree(
      activityRepository.getOrganizationTree(attempt.packageID, attempt.organizationID),
      currentActivityID = None,
      currentActive = true,
      suspendedActivityID = None)
    activityStateTreeStorage.create(attempt.id, stateTree)
    activityStateTreeStorage.get(attempt.id).get
  }

  override def getActivityStateTreeForAttemptOrCreate(attempt: Attempt): ActivityStateTree = {
    getActivityStateTreeForAttemptOption(attempt) match {
      case Some(tree: ActivityStateTree) => tree
      case None                          => createActivityStateTreeForAttempt(attempt)
    }
  }

  override def updateActivityStateTree(attemptId: Int, activityStateTree: ActivityStateTree): Unit = {
    activityStateTreeStorage.modify(attemptId, activityStateTree)
  }

  override def getSuspendedId(userId: Long, lessonId: Long): Option[String] = {
    attemptStorage.getActive(userId, lessonId)
      .flatMap(a => activityStateTreeStorage.get(a.id).map(_.item.activity.id))
  }

}
