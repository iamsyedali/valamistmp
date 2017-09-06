/*
* FormDataHelper used for not immediate logo saving
*
* Supported in IE10+
* It store logo data and send by call submitData
 */
var IMAGE_PARAM_TYPE = {
  CONTENT_TYPE: 'contentType',
  INPUT_BASE64: 'inputBase64',
  FILE_ENTRY_ID: 'fileEntryID',
  FILE: 'file',
  FILE_VERSION: 'fileVersion',
  FILE_NAME: 'fileName'
};

/* FIXME: seems that FormDataHelper doesn't do anything if FormData isn't provided, but it's its primary task.
 * FIXME: Replace with plugin or add plugin separately for the purpose of not rewriting existing functionality.
*/
var FormDataHelper = Backbone.Model.extend({
  initialize: function (options) {
  },
  supports: function () {
    if (window.FormData) return true;
    else  return false;
  },
  setSetting: function (type, value) {
    switch (type) {
      case IMAGE_PARAM_TYPE.CONTENT_TYPE:
        this.contentType = value;
        break;
      case IMAGE_PARAM_TYPE.FILE:
        this.file = value;
        break;
      case IMAGE_PARAM_TYPE.FILE_ENTRY_ID:
        this.fileEntryID = value;
        break;
      case IMAGE_PARAM_TYPE.FILE_VERSION:
        this.fileVersion = value;
        break;
      case IMAGE_PARAM_TYPE.INPUT_BASE64:
        this.inputBase64 = value;
        break;
      case IMAGE_PARAM_TYPE.FILE_NAME:
        this.fileName = value;
        break;
    }
  },
  readAsDataURL: function(file, callback){
    if (window.FileReader ) {
      var reader = new FileReader();
      reader.onloadend = function (e) {
        callback(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  },
  resetImageSettings: function (folderId) {
    this.folderId = folderId;
    this.contentType = null;
    this.file = null;
    this.fileEntryID = null;
    this.fileVersion = null;
    this.inputBase64 = null;
    this.fileName = null;
  },
  setFolderId: function(folderId){
    this.folderId = folderId;
  },
  setPortletFileUploaderUrl: function(url) {
    this.portletFileUploaderUrl = url;
  },
  getFileName: function(){
    return (this.fileName == null) ? '' : this.fileName;
  },
  submitData: function(options) {
    options || (options = {});
    var success = _.isFunction(options)? options : options.success;
    var error = options.error;

    if (this.supports() && this.contentType != null) {
      var formData = new FormData();
      formData.append(IMAGE_PARAM_TYPE.CONTENT_TYPE, this.contentType);
      formData.append(IMAGE_PARAM_TYPE.FILE, this.file);
      formData.append(IMAGE_PARAM_TYPE.FILE_ENTRY_ID, this.fileEntryID);
      formData.append(IMAGE_PARAM_TYPE.FILE_VERSION, this.fileVersion);
      formData.append(IMAGE_PARAM_TYPE.INPUT_BASE64, this.inputBase64);
      formData.append('courseId', Utils.getCourseId());
      formData.append('p_auth', Liferay.authToken);

      var url =
        this.portletFileUploaderUrl ?
        this.portletFileUploaderUrl :
        path.root + path.api.files + '?action=ADD&folderId=' + this.folderId;

      jQuery.ajax({
        url: url,
        type: "POST",
        data: formData,
        processData: false,
        contentType: false,
        headers: {
          'X-CSRF-Token': Liferay.authToken
        },
        success: function (data) {
            if(_.isFunction(success)){
              if(data)
                success(data.name || data);
              else
                success();
            }
        },
        error: function (jqXHR, textStatus, errorMessage) {
            if(_.isFunction(error)){
                error();
            }
        }
      })
    }
    else success('');
  },
    isReadyToSubmit: function() {
        return this.supports() && this.contentType != null;
    }
});