package com.arcusys.valamis.certificate.model

/**
 * Created by Iliya Tryapitsin on 14.03.14.
 */
object CertificateStatusType extends Enumeration {
  type CertificateStatusType = Value
  val NEW = Value("NEW")
  val PASSED = Value("PASSED")
}

