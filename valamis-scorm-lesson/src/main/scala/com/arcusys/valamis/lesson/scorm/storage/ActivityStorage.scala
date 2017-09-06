package com.arcusys.valamis.lesson.scorm.storage

import com.arcusys.valamis.lesson.scorm.model.manifest.{ Activity, Organization }
import com.arcusys.valamis.util.TreeNode

trait ActivityStorage {
  def getAllFlat(packageId: Long): Seq[Activity]

  def getAll: Seq[Activity]

  def getAllOrganizations(packageId: Long): Seq[Organization]

  def getOrganizationTree(packageId: Long, organizationId: String): TreeNode[Activity]

  def getParent(packageId: Long, activityId: String): Option[Activity]

  def getChildren(packageId: Long, activityId: Option[String]): Seq[Activity]

  /**
   * Forms the activity path as the ordered series of activities from the Current Activity to the common ancestor
   * @param packageId given package ID
   * @param activityID given activity ID
   * @return activity path
   */
  def getActivityPath(packageId: Long, activityId: String): Seq[Activity]

  def get(packageId: Long, id: String): Option[Activity]

  def create(packageId: Long, entity: Activity)

}
