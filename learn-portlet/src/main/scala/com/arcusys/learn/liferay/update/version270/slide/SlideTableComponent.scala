package com.arcusys.learn.liferay.update.version270.slide

import com.arcusys.valamis.persistence.common.DbNameUtils._

import scala.slick.driver.JdbcProfile

trait SlideTableComponent {
  protected val driver: JdbcProfile

  import driver.simple._

  case class SlideSet(id: Option[Long] = None,
                      title: String,
                      description: String,
                      courseId: Long,
                      logo: Option[String] = None,
                      isTemplate: Boolean = false,
                      isSelectedContinuity: Boolean = false,
                      themeId: Option[Long] = None,
                      duration: Option[Long] = None,
                      scoreLimit: Option[Double] = None,
                      topDownNavigation:Boolean = false)

  class SlideSetTable(tag: Tag) extends Table[SlideSet](tag, tblName("SLIDE_SET")) {
    def id = column[Long]("ID", O.PrimaryKey, O.AutoInc)
    def title = column[String]("TITLE")
    def description = column[String]("DESCRIPTION", O.DBType(varCharMax))
    def courseId = column[Long]("COURSE_ID")
    def logo = column[Option[String]]("LOGO")
    def isTemplate = column[Boolean]("IS_TEMPLATE")
    def isSelectedContinuity = column[Boolean]("IS_SELECTED_CONTINUITY")
    def themeId = column[Option[Long]]("THEME_ID")
    def duration = column[Option[Long]]("DURATION")
    def scoreLimit = column[Option[Double]]("SCORE_LIMIT")
    def topDownNavigation = column[Boolean]("TOP_DOWN_NAVIGATION")

    def * = (id.?, title, description, courseId, logo, isTemplate, isSelectedContinuity, themeId, duration, scoreLimit, topDownNavigation) <>(SlideSet.tupled, SlideSet.unapply)
  }

  case class Slide(id: Option[Long] = None,
                   title: String,
                   bgColor: Option[String] = None,
                   bgImage: Option[String] = None,
                   font: Option[String] = None,
                   questionFont: Option[String] = None,
                   answerFont: Option[String] = None,
                   answerBg: Option[String] = None,
                   duration: Option[String] = None,
                   leftSlideId: Option[Long] = None,
                   topSlideId: Option[Long] = None,
                   slideSetId: Long,
                   statementVerb: Option[String] = None,
                   statementObject: Option[String] = None,
                   statementCategoryId: Option[String] = None,
                   isTemplate: Boolean = false,
                   isLessonSummary: Boolean = false)

  class SlideTable(tag: Tag) extends Table[Slide](tag, tblName("SLIDE")) {
    def id = column[Long]("ID", O.PrimaryKey, O.AutoInc)
    def title = column[String]("TITLE")
    def bgColor = column[Option[String]]("BG_COLOR")
    def bgImage = column[Option[String]]("BG_IMAGE")
    def font = column[Option[String]]("FONT")
    def questionFont = column[Option[String]]("QUESTION_FONT")
    def answerFont = column[Option[String]]("ANSWER_FONT")
    def answerBg = column[Option[String]]("ANSWER_BG")
    def duration = column[Option[String]]("DURATION")
    def leftSlideId = column[Option[Long]]("LEFT_SLIDE_ID")
    def topSlideId = column[Option[Long]]("TOP_SLIDE_ID")
    def slideSetId = column[Long]("SLIDE_SET_ID")
    def statementVerb = column[Option[String]]("STATEMENT_VERB")
    def statementObject = column[Option[String]]("STATEMENT_OBJECT")
    def statementCategoryId = column[Option[String]]("STATEMENT_CATEGORY_ID")
    def isTemplate = column[Boolean]("IS_TEMPLATE")
    def isLessonSummary = column[Boolean]("IS_LESSON_SUMMARY")

    def * = (
      id.?,
      title,
      bgColor,
      bgImage,
      font,
      questionFont,
      answerFont,
      answerBg,
      duration,
      leftSlideId,
      topSlideId,
      slideSetId,
      statementVerb,
      statementObject,
      statementCategoryId,
      isTemplate,
      isLessonSummary) <>(Slide.tupled, Slide.unapply)
  }

  case class SlideElement(id: Option[Long] = None,
                          zIndex: String,
                          content: String,
                          slideEntityType: String,
                          slideId: Long,
                          correctLinkedSlideId: Option[Long] = None,
                          incorrectLinkedSlideId: Option[Long] = None,
                          notifyCorrectAnswer: Option[Boolean] = None)

  class SlideElementTable(tag : Tag) extends Table[SlideElement](tag, tblName("SLIDE_ELEMENT")) {
    def id = column[Long]("ID", O.PrimaryKey, O.AutoInc)
    def zIndex = column[String]("Z_INDEX")
    def content = column[String]("CONTENT", O.DBType(varCharMax))
    def slideEntityType = column[String]("SLIDE_ENTITY_TYPE")
    def slideId = column[Long]("SLIDE_ID")
    def correctLinkedSlideId = column[Option[Long]]("CORRECT_LINKED_SLIDE_ID")
    def incorrectLinkedSlideId = column[Option[Long]]("INCORRECT_LINKED_SLIDE_ID")
    def notifyCorrectAnswer = column[Option[Boolean]]("NOTIFY_CORRECT_ANSWER")

    def * = (
      id.?,
      zIndex,
      content,
      slideEntityType,
      slideId,
      correctLinkedSlideId,
      incorrectLinkedSlideId,
      notifyCorrectAnswer) <>(SlideElement.tupled, SlideElement.unapply)
  }

  case class SlideElementProperty(slideElementId: Long,
                                  deviceId: Long,
                                  key: String,
                                  value: String)

  class SlideElementPropertyTable(tag : Tag) extends Table[SlideElementProperty](tag, tblName("SLIDE_ELEMENT_PROPERTY")) {
    def slideElementId = column[Long]("SLIDE_ELEMENT_ID")
    def deviceId = column[Long]("DEVICE_ID")
    def key = column[String]("DATA_KEY", O.Length(254, true))
    def value = column[String]("DATA_VALUE", O.Length(254, true))
    def pk = primaryKey("PK_PROPERTY", (slideElementId, deviceId, key))

    def * = (slideElementId, deviceId, key, value) <> (SlideElementProperty.tupled, SlideElementProperty.unapply)

  }

  val slideElements = TableQuery[SlideElementTable]
  val slideSets = TableQuery[SlideSetTable]
  val slides = TableQuery[SlideTable]
  val slideElementProperties = TableQuery[SlideElementPropertyTable]
}
