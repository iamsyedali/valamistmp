package com.arcusys.valamis.util

import java.io.{File, FileInputStream, FileOutputStream, InputStream}
import java.security.SecureRandom
import javax.activation.MimetypesFileTypeMap
import org.apache.commons.io.FileCleaningTracker

object FileSystemUtil {

  private val valamisTempDirectory = new File(System.getProperty("java.io.tmpdir"), "valamis")
  valamisTempDirectory.mkdirs()

  private val random = new SecureRandom

  /**
    * FileCleaningTracker starts daemon thread to check files for cleaning.
    * This thread should be stopped when the application/portlet is unloaded.
    * Now the #ContextListener called #stopCleaninTrack to stop thread
    * on contextDestroyed event.
    */
  private var fileCleaner = new FileCleaningTracker

  private def getRandomName: String = {
    val n = random.nextLong
    if (n == Long.MinValue) "0"
    else Math.abs(n).toString
  }

  def getTempDirectory(prefix: String): File = {
    val newDir = new File(valamisTempDirectory, prefix + getRandomName)
    newDir.mkdirs
    newDir
  }

  def getValamisTempDirectory: String = {
    valamisTempDirectory.getPath
  }

  def getTempFile(prefix: String, extension: String = "tmp"): File = {
    File.createTempFile(prefix + "_", "." + extension, valamisTempDirectory)
  }

  def deleteFile(file: File) {
    if (file.isDirectory)
      file.listFiles.foreach {
        f => deleteFile(f)
      }
    file.delete
  }

  def streamToTempFile(inputStream: InputStream, prefix: String, extension: String = "tmp"): File = {
    val newFile = FileSystemUtil.getTempFile(prefix, extension)

    val outputStream = new FileOutputStream(newFile)
    try {
      StreamUtil.writeToOutputStream(inputStream, outputStream)
    } finally {
      outputStream.close()
    }
    newFile
  }

  def arrayToTempFile(array: Array[Byte], prefix: String, extension: String): File = {
    val newFile = FileSystemUtil.getTempFile(prefix, extension)

    val outputStream = new FileOutputStream(newFile)
    try {
      outputStream.write(array)
      outputStream.flush()
    } finally {
      outputStream.close()
    }
    newFile
  }

  def getTextFileContent(file: File): String = {
    val source = scala.io.Source.fromFile(file)
    try {
      source.mkString
    } finally {
      source.close()
    }
  }

  def getFileContent(file: File): Array[Byte] = {
    val inputStream = new FileInputStream(file)
    try {
      StreamUtil.toByteArray(inputStream)
    } finally {
      inputStream.close()
    }
  }

  def getMimeType(fileUrl: String) = {
    val file = new File(fileUrl)
    new MimetypesFileTypeMap().getContentType(file)
  }

  /**
    * Sets file that will be removed after marker will be collected by GC.
    * If this method was used then #stopDeleteLaterTracking should be called
    * when deleting tracking is no longer needed
    * @param file to track.
    * @param marker is an object that notifies that file should be removed.
    */
  def deleteLater(file : File, marker: AnyRef): Unit = {
    fileCleaner.track(file, marker)
  }

  /**
    * Sets flag to exit for thread.
    * Daemon thread stops working after removing files.
    * This method should be called on unload stage
    * or when the cleaning tracking is no longer needed.
    */
  def stopDeleteLaterTracking(): Unit = {
    fileCleaner.exitWhenFinished()
  }
}