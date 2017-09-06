package com.arcusys.valamis.lesson.scorm.service.sequencing

import com.arcusys.valamis.lesson.scorm.model.manifest.LeafActivity
import com.arcusys.valamis.lesson.scorm.model.tracking.ActivityStateNode
import com.escalatesoft.subcut.inject.{ Injectable, BindingModule }

/**
 * End Attempt Process [UP.4] for an activity - implementation
 */
class EndAttemptService(implicit val bindingModule: BindingModule) extends EndAttemptServiceContract with Injectable {
  private val rollupService = inject[RollupServiceContract]

  /**
   * End Attempt Process [UP.4] for an activity
   * May set 'attempt completed' and 'primary objective satisfied'
   * Clears 'active' flag
   * Rolls up activity
   */
  def apply(activity: ActivityStateNode) {
    activity.item.activity match {
      case leaf: LeafActivity =>
        // The sequencer will not affect the state of suspended activities
        if (leaf.isTracked && !activity.item.suspended) {
          // Should the sequencer set the completion status of the activity?
          // And did the content inform the sequencer of the activity's completion status?
          if (!leaf.isCompletionSetByContent && activity.item.getCompletionStatus().isEmpty) activity.item.setCompletionStatus(Some(true))
          // Should the sequencer set the  objective status of the activity?
          if (!leaf.isObjectiveSetByContent && leaf.sequencing.primaryObjective.isDefined) {
            val primaryObjectiveState = activity.item.objectiveStates(None)
            // Did the content inform the sequencer of the activity's rolled-up objective status?
            if (primaryObjectiveState.getSatisfiedStatus.isEmpty) primaryObjectiveState.setSatisfiedStatus(Some(true))
          }
        }
      case _ => activity.item.suspended = activity.children.exists(_.item.suspended)
    }
    // The current attempt on this activity has ended
    activity.item.active = false
    //Ensure that any status change to this activity is propagated through the entire activity tree.
    rollupService(activity)
  }
}