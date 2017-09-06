package com.arcusys.valamis.content.export

import java.io.FileInputStream

import com.arcusys.valamis.content.export.model._
import com.arcusys.valamis.content.model._
import com.arcusys.valamis.content.service._
import com.arcusys.valamis.util.ZipBuilder
import com.arcusys.valamis.util.export.ExportProcessor

abstract class QuestionExportProcessor
  extends ExportProcessor[QuestionCategoryExport, QuestionCategoryExport] {

  override protected def exportItemsImpl(zip: ZipBuilder, items: Seq[QuestionCategoryExport]): Seq[QuestionCategoryExport] = items

  def questionService: QuestionService
  def plainTextService: PlainTextService
  def catService: CategoryService

  def exportAll(courseId: Long): FileInputStream = {
    val questionsWithoutCategory = questionService.getByCategory(None, courseId)
    val plainTextsWithoutCategory = plainTextService.getByCategory(None, courseId)

    var items = Seq(QuestionCategoryExport("root", "",
      children = questionsWithoutCategory.map(q => {
        val (question, answers) = questionService.getWithAnswers(q.id.get)
        toQuestionExport(question, answers)
      }) ++
        plainTextsWithoutCategory.map(toQuestionExport),
      Seq()
    ))

    val categories = catService.getByCategory(None, courseId)

    items = items ++ categories.map(toCategoryExport(_, Some(courseId)))

    if (items.isEmpty) {
      throw new NoSuchElementException("No questions to export")
    }

    exportItems(items)
  }

  def exportIds(categoryIDs: Seq[Long], questionIds: Seq[Long], plainTextIds: Seq[Long], courseID: Option[Long]): FileInputStream = {

    var items = Seq[QuestionCategoryExport]()

    val categories = categoryIDs.map(catService.getByID).collect { case Some(cat) => cat }

    val questions = questionIds.map(qId => questionService.getWithAnswers(qId))
    val plainTexts = plainTextIds.map(plainTextService.getById)

    val itemsCategoryIds: Seq[Long] = (
      questions.map(_._1.categoryId) ++
        plainTexts.map(_.categoryId)
      ).distinct.collect({ case Some(cId) if !categoryIDs.contains(cId) => cId })

    val rootItems =
      questions.collect {
        case (q, answers) if q.categoryId.isEmpty => toQuestionExport(q, answers)
      } ++
        plainTexts.collect {
          case pt if pt.categoryId.isEmpty => toQuestionExport(pt)
        }

    items = items ++ Seq(QuestionCategoryExport("root", "", rootItems, Seq()))

    items = items ++ categories.map(toCategoryExport(_, courseID))

    itemsCategoryIds.foreach(qcId => {
      catService.getByID(qcId).foreach(cat => {
        items = items ++ Seq(QuestionCategoryExport(
          cat.title,
          cat.description,
          questions.filter(_._1.categoryId.contains(cat.id.get)).map(q => toQuestionExport(q._1, q._2)) ++
            plainTexts.filter(_.categoryId.contains(cat.id.get)).map(toQuestionExport),
          Seq(),
          "folder",
          0))
      })
    })

    if (items.isEmpty) {
      throw new NoSuchElementException("No items to export")
    }

    exportItems(items)
  }

  private def toCategoryExport(category: Category, courseID: Option[Long]): QuestionCategoryExport = {
    val questions = questionService.getByCategory(category.id, courseID.get)
    val plainTexts = plainTextService.getByCategory(category.id, courseID.get)
    val cats = catService.getByCategory(category.id, courseID.get)
    QuestionCategoryExport(
      category.title,
      category.description,
      questions.map(q => toQuestionExport(q, questionService.getAnswers(q.id.get))) ++
        plainTexts.map(toQuestionExport),
      cats.map(toCategoryExport(_, courseID)),
      "folder",
      0)
  }

  private def toQuestionExport(plainText: PlainText): QuestionExport = {
    QuestionExport(entityType = "entity",
      title = plainText.title,
      text = plainText.text,
      "",
      None,
      None,
      forceCorrectCount = false,
      isCaseSensitive = false,
      Seq(),
      questionType = 8,
      arrangementIndex = 0)
  }

  private def toQuestionExport(question: Question, answers: Seq[Answer]): QuestionExport = {
    QuestionExportBuilder.toExport(question, answers)
  }

}

