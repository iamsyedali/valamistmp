package com.arcusys.valamis.lesson.scorm.model

import com.arcusys.valamis.lesson.scorm.model.manifest.{ AssetResource, Metadata, ResourceFile }
import org.scalatest.FlatSpec
import org.scalatest.matchers.ShouldMatchers

class AssetResourceTest extends FlatSpec with ShouldMatchers {
  val someFiles = Seq(new ResourceFile("file1.html"), new ResourceFile("file2.js"))
  val someDependencyIds = Seq("RES2", "RES0")
  val someMetadata = new Metadata(Seq("meta.xml"), Seq("<info>data</info>"))

  "Asset resource entity" can "be constructed" in {
    val resource = new AssetResource("RES1", Some("file1.html"), Some("RES1/files/"), someFiles, someDependencyIds, Some(someMetadata))
    resource.id should equal("RES1")
    resource.href should equal(Some("file1.html"))
    resource.base should equal(Some("RES1/files/"))
    resource.files should equal(someFiles)
    resource.dependencyIds should equal(someDependencyIds)
    resource.metadata should equal(Some(someMetadata))
  }

  it can "be constructed with empty metadata" in {
    val resource = new AssetResource("RES1", Some("file1.html"), Some("RES1/files/"), someFiles, someDependencyIds, None)
    resource.id should equal("RES1")
    resource.href should equal(Some("file1.html"))
    resource.base should equal(Some("RES1/files/"))
    resource.files should equal(someFiles)
    resource.dependencyIds should equal(someDependencyIds)
    resource.metadata should equal(None)
  }

  it can "be constructed without dependencies" in {
    val resource = new AssetResource("RES1", Some("file1.html"), Some("RES1/files/"), someFiles, Nil, Some(someMetadata))
    resource.id should equal("RES1")
    resource.href should equal(Some("file1.html"))
    resource.base should equal(Some("RES1/files/"))
    resource.files should equal(someFiles)
    resource.dependencyIds should equal(Nil)
    resource.metadata should equal(Some(someMetadata))
  }
  //TODO: such resources must have to external URLs
  it can "be constructed without files" in {
    val resource = new AssetResource("RES1", Some("file1.html"), Some("RES1/files/"), Nil, someDependencyIds, Some(someMetadata))
    resource.id should equal("RES1")
    resource.href should equal(Some("file1.html"))
    resource.base should equal(Some("RES1/files/"))
    resource.files should equal(Nil)
    resource.dependencyIds should equal(someDependencyIds)
    resource.metadata should equal(Some(someMetadata))
  }

  it can "be constructed without base" in {
    val resource = new AssetResource("RES1", Some("file1.html"), None, someFiles, someDependencyIds, Some(someMetadata))
    resource.id should equal("RES1")
    resource.href should equal(Some("file1.html"))
    resource.base should equal(None)
    resource.files should equal(someFiles)
    resource.dependencyIds should equal(someDependencyIds)
    resource.metadata should equal(Some(someMetadata))
  }

  it can "be constructed without launching URL" in {
    val resource = new AssetResource("RES1", None, Some("RES1/files/"), someFiles, someDependencyIds, Some(someMetadata))
    resource.id should equal("RES1")
    resource.href should equal(None)
    resource.base should equal(Some("RES1/files/"))
    resource.files should equal(someFiles)
    resource.dependencyIds should equal(someDependencyIds)
    resource.metadata should equal(Some(someMetadata))
  }
  //TODO: it should be meaningless to construct an asset resource without both launching URL and files
  it can "be constructed without base, files, dependencies and metadata" in {
    val resource = new AssetResource("RES1", Some("file1.html"), None, Nil, Nil)
    resource.id should equal("RES1")
    resource.href should equal(Some("file1.html"))
    resource.base should equal(None)
    resource.files should equal(Nil)
    resource.dependencyIds should equal(Nil)
    resource.metadata should equal(None)
  }
  //TODO: but may it have local files in this case?
  //TODO: maybe we might use some URL class to store these URLs?
  it can "be constructed for an external URL" in {
    val resource = new AssetResource("RES1", Some("http://google.com"), Some("RES1/files/"), someFiles, someDependencyIds, Some(someMetadata))
    resource.id should equal("RES1")
    resource.href should equal(Some("http://google.com"))
    resource.base should equal(Some("RES1/files/"))
    resource.files should equal(someFiles)
    resource.dependencyIds should equal(someDependencyIds)
    resource.metadata should equal(Some(someMetadata))
  }

  it can "be constructed with parameters in URL" in {
    val resource = new AssetResource("RES1", Some("file1.html?id=2"), Some("RES1/files/"), someFiles, someDependencyIds, Some(someMetadata))
    resource.id should equal("RES1")
    resource.href should equal(Some("file1.html?id=2"))
    resource.base should equal(Some("RES1/files/"))
    resource.files should equal(someFiles)
    resource.dependencyIds should equal(someDependencyIds)
    resource.metadata should equal(Some(someMetadata))
  }

  it should "not accept URL with leading slash" in {
    intercept[IllegalArgumentException] {
      new AssetResource("RES1", Some("/file1.html"), Some("RES1/files/"), someFiles, someDependencyIds, Some(someMetadata))
    }
  }

  it should "not accept base with leading slash" in {
    intercept[IllegalArgumentException] {
      new AssetResource("RES1", Some("file1.html"), Some("/RES1/files/"), someFiles, someDependencyIds, Some(someMetadata))
    }
  }

  it should "not accept base without trailing slash" in {
    intercept[IllegalArgumentException] {
      new AssetResource("RES1", Some("file1.html"), Some("RES1/files"), someFiles, someDependencyIds, Some(someMetadata))
    }
  }
}
