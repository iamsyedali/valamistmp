//package com.arcusys.learn.controllers
//
////import org.scalatra.test.scalatest.ScalatraSuite
//import org.scalamock.scalatest.MockFactory
//import com.arcusys.learn.test.mocks.MockInjectableFactory
//import com.arcusys.learn.service.util.SessionHandlerContract
//import org.mockito.Mockito
//import javax.servlet.http.HttpServletResponse
//import org.scalamock.proxy.ProxyMockFactory
//import org.scalatest.{ BeforeAndAfterEach, FlatSpec }
//import com.arcusys.learn.facades.{ UserFacadeContract, CertificateFacadeContract }
//import com.arcusys.learn.mocks.Mocks
//import com.arcusys.valamis.utils.JsonSupport
//import com.arcusys.learn.controllers.api.{ UserApiController }
//
///**
// * Created by Iliya Tryapitsin on 05.03.14.
// */
////class UserApiControllerTest extends FlatSpec with ScalatraSuite with MockFactory with BeforeAndAfterEach with ProxyMockFactory with MockInjectableFactory with JsonSupport {
//
//  // TODO: fix initializationError(com.arcusys.learn.controllers.UserApiControllerTest): No binding for key BindingKey(com.arcusys.learn.facades.CourseFacadeContract,None)
//  //  override def beforeEach() {
//  //    Mockito.reset(Mocks.certificateFacadeContract, Mocks.sessionHandlerContract, Mocks.userFacade)
//  //  }
//  //
//  //  bindingModule.modifyBindings(module => {
//  //    module.bind[SessionHandlerContract] toSingle Mocks.sessionHandlerContract
//  //    module.bind[CertificateFacadeContract] toSingle Mocks.certificateFacadeContract
//  //    module.bind[UserFacadeContract] toSingle Mocks.userFacade
//  //
//  //    addServlet(new UserApiController(module), "")
//  //  })
//  //
//  //  "UserApiController" should "return orgs" in {
//  //    get("/orgs") {
//  //      status should equal(HttpServletResponse.SC_NO_CONTENT)
//  //    }
//  //  }
//}