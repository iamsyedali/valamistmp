package com.arcusys.learn.liferay.util

import com.liferay.portal.kernel.search.{Document, SearchEngineUtil}

object SearchEngineUtilHelper {

  val SearchContentFileName = "search_content.txt"
  val SearchContentFileCharset = "UTF-8"

  def updateDocuments(searchEngineId: String,
    companyId: Long,
    documents: java.util.Collection[Document]) =
    SearchEngineUtil.updateDocuments(searchEngineId, companyId, documents)

  def updateDocument(searchEngineId: String,
    companyId: Long,
    document: Document) =
    SearchEngineUtil.updateDocument(searchEngineId, companyId, document)
}
