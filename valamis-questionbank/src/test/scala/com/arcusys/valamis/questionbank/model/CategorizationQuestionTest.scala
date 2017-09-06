package com.arcusys.valamis.questionbank.model

import org.scalatest.{ FlatSpec, Matchers }

class CategorizationQuestionTest extends FlatSpec with Matchers {
  "Categorization answer" can "be constructed" in {
    val answer = new CategorizationAnswer(11, "Scala", Some("JVM"))
    answer.id should equal(11)
    answer.text should equal("Scala")
    answer.answerCategoryText should equal(Some("JVM"))
  }

  private def someAnswers = Seq(
    new CategorizationAnswer(11, "Scala", Some("JVM")),
    new CategorizationAnswer(2, "Java", Some("JVM")),
    new CategorizationAnswer(33, "C", None),
    new CategorizationAnswer(34, "C#", Some(".NET"))
  )

  private def constructQuestion(categoryId: Option[Int], answers: Seq[CategorizationAnswer]) = new CategorizationQuestion(
    id = 88,
    categoryID = categoryId,
    title = "Programming language platforms",
    text = "Which programming language runs on which platform",
    explanationText = "Yes, I know Scala can go both",
    rightAnswerText = "Your answer is correct",
    wrongAnswerText = "Your answer is incorrect",
    answers = answers,
    courseID = Some(1)
  )

  private def checkFields(question: CategorizationQuestion, categoryId: Option[Int], answers: Seq[CategorizationAnswer]) {
    question.questionTypeCode should equal(7)
    question.id should equal(88)
    question.categoryID should equal(categoryId)
    question.title should equal("Programming language platforms")
    question.text should equal("Which programming language runs on which platform")
    question.explanationText should equal("Yes, I know Scala can go both")
    question.rightAnswerText should equal("Your answer is correct")
    question.wrongAnswerText should equal("Your answer is incorrect")
    question.answers should equal(answers)
  }

  "Categorization quiestion" can "be constructed" in {
    val answers = someAnswers
    val question = constructQuestion(categoryId = Some(8), answers = answers)
    checkFields(question, categoryId = Some(8), answers = answers)
  }

  it can "be constructed with empty category" in {
    val answers = someAnswers
    val question = constructQuestion(categoryId = None, answers = answers)
    checkFields(question, categoryId = None, answers = answers)
  }

  it can "be constructed without answers" in {
    val question = constructQuestion(categoryId = Some(8), answers = Nil)
    checkFields(question, categoryId = Some(8), answers = Nil)
  }
}
