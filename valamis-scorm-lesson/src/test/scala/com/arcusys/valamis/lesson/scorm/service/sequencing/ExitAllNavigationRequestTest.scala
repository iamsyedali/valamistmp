package com.arcusys.valamis.lesson.scorm.service.sequencing

import com.arcusys.valamis.lesson.scorm.model.sequencing.{ NavigationRequestType, NavigationResponseInvalid, NavigationResponseWithTermination }

@org.junit.runner.RunWith(classOf[org.scalatest.junit.JUnitRunner])
class ExitAllNavigationRequestTest extends NavigationRequestServiceTestBase(NavigationRequestType.ExitAll) {
  "Exit All navigation request" should "succeed if current activity is defined (9.1.1)" in {
    expectResult(NavigationResponseWithTermination, rootOnlyTree(hasCurrent = true))
  }

  it should "fail if current activity is not defined (9.2.1)" in {
    expectResult(NavigationResponseInvalid, rootOnlyTree())
  }
}