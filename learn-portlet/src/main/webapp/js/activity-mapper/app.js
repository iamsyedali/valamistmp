var ActivityMapperApp = new Marionette.Application();

ActivityMapperApp.addInitializer(function(options){
  var collectionView = new ActivityMapperApp.ViewModule.ActivityMapperRowCollectionView({
    collection: ActivityMapperApp.request('setting:list'), el: jQuery('.js-social-activities-mapper-data')
  });
  collectionView.render();
});