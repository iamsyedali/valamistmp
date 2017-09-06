LRS2ActivityMapperApp.module("ViewModule", function(ViewModule, LRS2ActivityMapperApp, Backbone, Marionette, $, _){

  ViewModule.ActivityMapperRowView = Marionette.ItemView.extend({
    tagName: 'tr',
    template: function (data) {
      return Mustache.to_html(jQuery('#activitySocialMapperRow').html(), _.extend(
        data, language, {activityName: language[data.activityID]}
      ))
    },
    events: {
      'click .js-title-edit': 'toggleTitleEdit',
      'click .js-filter-delete': 'deleteFilter',
      'click .js-title-save': function() {
        this.toggleTitleEdit();
        this.saveTitle();
      },
      'change .js-verb-filter': 'updateModel',
      'change .js-activity-filter': 'updateModel'
    },
    toggleTitleEdit: function() {
      this.$('.js-title-viewer,.js-title-editor').toggleClass('hidden');
    },
    saveTitle: function() {
      var title = this.$('.mapping-title').val();
      this.model.set('title', title);
      this.model.save();
      this.$('.title-view').html(title);
    },
    updateModel: function() {
      // check for empty settings
      var mappedVerb = this.$('.js-verb-filter').val();
      if (mappedVerb.length === 0) mappedVerb = null;

      var mappedActivity = this.$('.js-activity-filter').val();
      if (mappedActivity.length === 0) mappedActivity = null;

      this.model.set({'mappedVerb': mappedVerb});
      this.model.set({'mappedActivity': mappedActivity});

      this.model.save();
    },
    deleteFilter: function() {
      this.model.destroy();
    }
  });

  ViewModule.ActivityMapperRowCollectionView = Marionette.CollectionView.extend({
    tagName: 'tbody',
    childView: ViewModule.ActivityMapperRowView
  });


  ViewModule.ControlsView = Marionette.ItemView.extend({
    initialize: function(options){
      language = options.language
    },
    template: function () {
      return Mustache.to_html(jQuery('#lrs2ActivityMapperControls').html(), language)
    },
    events: {
      'click .js-add-new': 'add'
    },
    add: function() {
      var collection = LRS2ActivityMapperApp.request('event:list');
      var model = new LRS2ActivityMapperApp.Entities.ActivityMapperModel({
        courseId: Utils.getCourseId()
      });

      model.save().then(function(){
        collection.add(model);
      })
    }
  });
});