import java.io.File

import sbt.{IO, _}
import Settings.{LiferayPluginProperties, ValamisPluginProperties}

object ResourceActions {

  def copyFromBundleToWar(moduleName: String, dstDir: File, dirsToCopy: Seq[String]): Unit = {
    val src = dstDir / s"/../../../$moduleName/src/main/resources/META-INF/resources"
    dirsToCopy foreach { dirName =>
      IO.copyDirectory(src / dirName, dstDir / dirName, preserveLastModified = true, overwrite = true)
    }
  }

  // Resource actions after building OSGI Bundle
  def bundleActions(dir: _root_.sbt.Types.Id[File]): Unit = {
    val src = dir / "../../../../../learn-portlet/src/main/webapp/"

    IO.createDirectory(dir / "views")

    IO.listFiles(src, "*.html").toSeq
      .foreach(file => IO.copyFile(file, dir / "META-INF/resources" / file.name))

    IO.copyDirectory(src / "templates", dir / "META-INF/resources/templates")
    IO.copyDirectory(src / "js", dir / "META-INF/resources/js")
    IO.copyDirectory(src / "img", dir / "META-INF/resources/img")
    IO.copyDirectory(src / "images", dir / "META-INF/resources/images")
    IO.copyDirectory(src / "i18n", dir / "META-INF/resources/i18n")
    IO.copyDirectory(src / "fonts", dir / "META-INF/resources/fonts")
    IO.copyDirectory(src / "css", dir / "META-INF/resources/css")
    IO.copyDirectory(src / "fop", dir / "META-INF/resources/fop")
    IO.copyDirectory(src / "preview-resources", dir / "META-INF/resources/preview-resources")
    IO.copyDirectory(src / "emails", dir / "META-INF/resources/emails")

    fillTemplateFile(dir, "META-INF/resources/js/helpers/Utils.js", ValamisPluginProperties)

    val resourceSrc = dir / "../../../../../learn-portlet/src/main/resources/"
    IO.copyDirectory(resourceSrc / "content", dir / "content")

    IO.createDirectory(dir / "VALAMIS-OSGI-INF")
    WebXmlSupport.processWebXml(src / "WEB-INF/web.xml", s"$dir/VALAMIS-OSGI-INF")

    prepareResources(dir)
  }

  // Resource actions after building WAR file
  def warActions(webappDir: File): Unit = {
    IO.copyDirectory(
      webappDir / "../../../learn-portlet/src/main/resources/ext-libs",
      webappDir / "WEB-INF/lib",
      overwrite = true)

    fillTemplateFile(webappDir, "js/helpers/Utils.js", ValamisPluginProperties)

    fillTemplateFile(
      webappDir,
      "../../../learn-portlet/src/main/resources/liferay-plugin-package.properties",
      ValamisPluginProperties,
      Settings.liferayPluginPropertiesPath)
  }

  // Fill template files with Valamis properties
  def fillTemplateFile(webappDir: File, sourcePath: String, props: LiferayPluginProperties, targetPath: String = ""): Unit = {
    val sourceAppPath = webappDir / sourcePath
    val targetAppPath = webappDir / (if (targetPath.isEmpty) sourcePath else targetPath)
    IO.write(targetAppPath, Settings.fillLiferayPluginProperties(sourceAppPath, props))
  }

  // prepare separate resources for OSGI bundle
  def prepareResources(webappDir: File): Unit = {
    val resoursePath = "META-INF/resources/"
    val configPath = "META-INF/resources/js/"
    val resources = Seq(
      "vendors.js",
      "file-upload.js",
      "valamis-common.js",
      "vendors-lesson-studio.js",
      //dashboard
      "lesson-studio.js",
      "lesson-viewer.js",
      "content-provider.js",
      "valamis-study-summary.js",
      "valamis-activities.js",
      "recent-lessons.js",
      "my-lessons.js",
      "my-courses.js",
      "my-certificates.js",
      "achieved-certificates.js",
      "learning-paths.js",
      //lesson tools
      "lesson-manager.js",
      "content-manager.js",
      "all-courses.js",
      //reports
      "valamis-report.js",
      "learning-pattern-report.js",

      //analytics
      "statement-viewer.js",
      "gradebook.js",
      "learning-transcript.js",
      "certificate-expiration-tracker.js",

      // ckeditor resource container
      "ckeditor-all.js",

      // portlets resource containers
      "achieved-certificates-all.js",
      "admin-all.js",
      "all-courses-all.js",
      "all-courses-student-all.js",
      "certificate-expiration-tracker-all.js",
      "content-manager-all.js",
      "content-provider-all.js",
      "gradebook-all.js",
      "learning-paths-all.js",
      "learning-pattern-report-all.js",
      "learning-transcript-all.js",
      "lesson-manager-all.js",
      "lesson-studio-all.js",
      "lesson-viewer-all.js",
      "my-certificates-all.js",
      "my-courses-all.js",
      "my-lessons-all.js",
      "recent-lessons-all.js",
      "statement-viewer-all.js",
      "valamis-activities-all.js",
      "valamis-report-all.js",
      "valamis-study-summary-all.js"

    )

    resources.foreach(fileName => {
      fillAggregateFile(webappDir, configPath + fileName, resoursePath, "/js/" + fileName)
    })

  }

  private def fillAggregateFile(webappDir: File, configFile: String, filesPath: String, outputName: String): Unit = {
    val src = webappDir / "../../../../src/main/resources/"
    val valamisJsAppPath = webappDir / filesPath
    val in = src / configFile
    val out = webappDir / filesPath / outputName
    val files = IO.read(in).split('\n').filterNot(_.isEmpty).filterNot(_.startsWith("//"))

    IO.write(out, "") // clear output infile

    files foreach { file =>
      IO.append(out, "\r\n;")
      IO.append(out, IO.readBytes(valamisJsAppPath / file))
      IO.append(out, "\r\n\r\n")
    }
  }
}