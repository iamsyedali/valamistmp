package com.arcusys.learn.liferay.update.version250

import com.arcusys.learn.liferay.LiferayClasses.LUpgradeProcess
import com.arcusys.learn.liferay.LogFactoryHelper
import com.arcusys.learn.liferay.update.version250.slide.SlideTableComponent
import com.arcusys.valamis.persistence.common.SlickDBInfo
import com.arcusys.valamis.web.configuration.ioc.Configuration

class DBUpdater2415(dbInfo: SlickDBInfo) extends LUpgradeProcess with SlideTableComponent{
  val logger = LogFactoryHelper.getLog(getClass)

  override def getThreshold = 2415

  lazy val driver = dbInfo.slickDriver
  lazy val db = dbInfo.databaseDef
  import driver.simple._

  def this() = this(Configuration.inject[SlickDBInfo](None))

  override def doUpgrade(): Unit = {
    db.withTransaction { implicit session =>
        val slideSetId = slideSets.filter(_.courseId === 0L).first.id
        val textAndImageSlideId = slides returning slides.map(_.id) +=
          createSlideEntity("Text and image","text-and-image.png",slideSetId.get)
        val textSlideId = slides returning slides.map(_.id) +=
          createSlideEntity("Text only","text-only.png",slideSetId.get)
        val titleSlideId = slides returning slides.map(_.id) +=
          createSlideEntity("Title and subtitle","title-and-subtitle.png",slideSetId.get)
        val videoSlideId = slides returning slides.map(_.id) +=
          createSlideEntity("Video only","video-only.png",slideSetId.get)

        var elements = Seq[SlideElement]()
        elements = elements :+ createSlideElementEntity("25", "80", "800", "80", "1",
          "<div><strong><span style=\"font-size:48px\">Page header</span></strong></div>",
          "text",textAndImageSlideId
        ):+ createSlideElementEntity("160", "60", "320", "490", "2",
          "<div style=\"text-align:left\"><span style=\"font-size:20px, font-weight: lighter\">Page text</span></div>",
          "text",textAndImageSlideId
        ):+ createSlideElementEntity("160", "420", "480", "490", "3", "", "image", textAndImageSlideId
        ):+ createSlideElementEntity("25", "80", "800", "80", "1",
          "<div><span style=\"font-size:48px\">Page header</span></div>",
          "text",textSlideId
        ):+ createSlideElementEntity("160", "80", "800", "490", "2",
          "<div style=\"text-align:left\"><span style=\"font-size:20px\">Page text</span></div>",
          "text",textSlideId
        ):+ createSlideElementEntity("160", "80", "800", "80", "1",
          "<div><strong><span style=\"font-size:48px\">Page header</span></strong></div>",
          "text",titleSlideId
        ):+ createSlideElementEntity("240", "80", "800", "80", "2",
          "<div><span style=\"font-size:20px\">Page subtitle</span></div>",
          "text",titleSlideId
        ):+ createSlideElementEntity("25", "80", "800", "80", "1",
          "<div><span style=\"font-size:48px\">Page header</span></div>",
          "text",videoSlideId
        ):+ createSlideElementEntity("160", "80", "800", "490", "2","", "video", videoSlideId)

        elements.foreach(element =>{
          slideElements returning slideElements.map(_.id) insert element
        })
      }
  }

  private def createSlideEntity(title: String, bgImage: String, slideSetId: Long): Slide ={
    Slide(
      title = title,
      bgImage = Some(bgImage),
      slideSetId = slideSetId,
      isTemplate = true)
  }

  private def createSlideElementEntity(top: String,
                        left: String,
                        width: String,
                        height: String,
                        zIndex: String,
                        content: String,
                        slideEntityType: String,
                        slideId: Long): SlideElement ={
    SlideElement(
      top = top,
      left = left,
      width = width,
      height = height,
      zIndex = zIndex,
      content = content,
      slideEntityType = slideEntityType,
      slideId = slideId)
  }
}