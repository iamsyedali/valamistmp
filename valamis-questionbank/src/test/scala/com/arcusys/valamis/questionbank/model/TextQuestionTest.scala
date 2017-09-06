package com.arcusys.valamis.questionbank.model

import org.scalatest.{ FlatSpec, Matchers }

class TextQuestionTest extends FlatSpec with Matchers {
  "Text answer" can "be constructed" in {
    val answer = new TextAnswer(11, "Every me")
    answer.id should equal(11)
    answer.text should equal("Every me")
  }

  private def someAnswers = Seq(
    new TextAnswer(11, "Every me"),
    new TextAnswer(7, "Every you")
  )

  private def constructQuestion(categoryId: Option[Int], answers: Seq[TextAnswer]) = new TextQuestion(
    id = 110,
    categoryID = categoryId,
    title = "Placebo songs",
    text = "Every somebody?",
    explanationText = "Lalala",
    rightAnswerText = "Your answer is correct",
    wrongAnswerText = "Your answer is incorrect",
    answers = answers,
    isCaseSensitive = false,
    courseID = Some(1)
  )

  private def checkFields(question: TextQuestion, categoryId: Option[Int], answers: Seq[TextAnswer]) {
    question.questionTypeCode should equal(1)
    question.id should equal(110)
    question.categoryID should equal(categoryId)
    question.title should equal("Placebo songs")
    question.text should equal("Every somebody?")
    question.explanationText should equal("Lalala")
    question.rightAnswerText should equal("Your answer is correct")
    question.wrongAnswerText should equal("Your answer is incorrect")
    question.isCaseSensitive should equal(false)
    question.answers should equal(answers)
  }

  "Text answer question" can "be constructed" in {
    val answers = someAnswers
    val question = constructQuestion(categoryId = Some(20), answers = answers)
    checkFields(question, categoryId = Some(20), answers = answers)
  }

  it can "be constructed with empty category" in {
    val answers = someAnswers
    val question = constructQuestion(categoryId = None, answers = answers)
    checkFields(question, categoryId = None, answers = answers)
  }

  it can "be constructed without answers" in {
    val question = constructQuestion(categoryId = Some(11), answers = Nil)
    checkFields(question, categoryId = Some(11), answers = Nil)
  }

}
