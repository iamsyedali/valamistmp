package com.arcusys.valamis.persistence.common

import slick.driver.JdbcProfile
import slick.jdbc.JdbcBackend

import scala.concurrent.duration._
import scala.concurrent.{Await, ExecutionContext, Future}


/**
  * Created by pkornilov on 20.04.16.
  */
trait DatabaseLayer { self: SlickProfile =>

  import driver.api._

  val dbTimeout = Duration.Inf
  def db: JdbcBackend#DatabaseDef

  def execAsync[T](action: DBIO[T]): Future[T] = {
    db.run(action)
  }

  def execAsyncInTransaction[T](action: DBIO[T]): Future[T] = {
    db.run(action.transactionally)
  }

  def execSync[T](action: DBIO[T]): T = {
    Await.result(db.run(action), dbTimeout)
  }

  def execSyncInTransaction[T](action: DBIO[T]): T = {
    Await.result(db.run(action.transactionally), dbTimeout)
  }

}

object DatabaseLayer {

  import slick.dbio.DBIO

  val dbTimeout = 90 seconds

  def sequence[T](actions: Seq[DBIO[T]]): DBIO[Seq[T]] =
    DBIO.sequence(actions)

  implicit class DBActionOpts[A](val action: DBIO[Option[A]]) extends AnyVal {

    def ifSomeThen[B](g: A => DBIO[B])(implicit cxt: ExecutionContext): DBIO[Option[B]] =
      action flatMap (_ map g moveOption)
  }

  implicit class OptionDBActionOpts[A](val a: Option[DBIO[A]]) extends AnyVal {

    def moveOption(implicit cxt: ExecutionContext): DBIO[Option[A]] = a match {
      case Some(f) => f map (Some(_))
      case None => DBIO.successful(None)
    }

  }
}

//TODO: remove it
class Slick3DatabaseLayer(val db: JdbcBackend#DatabaseDef,
                          val driver: JdbcProfile)
  extends DatabaseLayer
    with SlickProfile






