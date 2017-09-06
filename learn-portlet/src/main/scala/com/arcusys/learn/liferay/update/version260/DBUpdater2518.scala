package com.arcusys.learn.liferay.update.version260

import com.arcusys.learn.liferay.LiferayClasses.LUpgradeProcess
import com.arcusys.learn.liferay.update.SlickDBContext
import com.arcusys.learn.liferay.update.version260.migrations.PackageScopeRuleMigration
import com.arcusys.valamis.web.configuration.ioc.Configuration

class DBUpdater2518 extends LUpgradeProcess with SlickDBContext{

  override def getThreshold = 2518

  implicit val bindingModule = Configuration

  override def doUpgrade(): Unit = {
    new PackageScopeRuleMigration(db, driver).migrate()
  }
}
