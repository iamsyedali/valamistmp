var articleCollectionService = new Backbone.Service({
    url: path.root,
    sync: {
        'read': {
            'path': function () {
                return path.api.liferayArticle+ '?companyID=' + Utils.getCompanyId();
            },
            'method': 'get'
        }
    }
});

var articleService = new Backbone.Service({
    url: function () {
        return lessonStudio.contentManagerActionUrl;
    },
    targets: {
        'getContent': {
            'path': function (model) {
                return '&companyID=' + Utils.getCompanyId()
                    + '&articleID=' + model.get('articleID')
                    + '&language=' + model.get('localeId')
                    + '&groupID=' + model.get('groupID');
            },
            'method': 'get'
        }
    }
});

var LiferayArticleModel = Backbone.Model.extend({
    parse: function (response) {
        var model = response;
        model.availableLocales = _.map(model.availableLocales, function (value, key) {
            value.id = key;
            return value;
        });
        model.localeId = model.availableLocales[0].id;
        model.title = model.titles[model.localeId];
        model.selected = false;
        return model;
    }
}).extend(articleService);

var LiferayArticleCollection = Backbone.Collection.extend({
    model: LiferayArticleModel
}).extend(articleCollectionService);

var LiferayArticleView = Backbone.View.extend({
    className: 'liferay-article',
    tagName: 'tr',
    initialize: function () {
        this.model.on('change:localeId', function () {
            this.model.set('title', this.model.get('titles')[this.model.get('localeId')]);
        }, this);

        this.model.on('change:title', function () {
            this.$('.title').text(this.model.get('title'));
        }, this);

        this.model.on('change:selected', function () {
            if (this.model.get('selected'))
                this.$el.addClass('selected');
            else
                this.$el.removeClass('selected');
        }, this)
    },
    events: {
        'change .article-locale': function () {
            this.model.set('localeId', this.$('.article-locale').val());
        },
        'click': function () {
            this.model.set('selected', true);
        }
    },
    render: function () {
        this.$el.html(Mustache.render(jQueryValamis('#articleTemplate').html(), this.model.attributes));
        return this;
    }
});

var LiferayArticleCollectionView = Backbone.View.extend({
    initialize: function () {
        this.collection.on('sync', this.render, this);
    },
    render: function () {
        this.collection.each(this.addOne, this);
    },
    addOne: function (liferayArticleModel) {
        var me = this;
        var liferayArticleView = new LiferayArticleView({model: liferayArticleModel});
        this.$el.append(liferayArticleView.render().el);

        liferayArticleModel.on('change:selected', function () {
            var liferayArticleModel = this;
            if (liferayArticleModel.get('selected')) {
                me.collection.each(function (item) {
                    if (item != liferayArticleModel) item.set('selected', false);
                });
            }
        }, liferayArticleModel)
    },
    submit: function (lessonModel) {
        var liferayArticleModel = this.collection.find(function (item) {
            return item.get('selected');
        });

        if (!liferayArticleModel) return;
        var self = this;
        liferayArticleModel.getContent().then(function (response) {
            self.trigger('article:added', response.text);
        });
    }
});

var AddTextArticleModal = Backbone.Modal.extend({
    template: function (data) {
        return Mustache.to_html(jQueryValamis('#add-article-template').html(),
            _.extend({header: Valamis.language['AddTextArticleLabel']}, Valamis.language))
    },
    submitEl: '.bbm-button',
    cancelEl: '.modal-close',
    className: 'val-modal liferay-articles-modal',
    onRender: function () {
        this.liferayArticleCollection = new LiferayArticleCollection();
        this.liferayArticleCollectionView = new LiferayArticleCollectionView({
            collection: this.liferayArticleCollection,
            el: this.$('#articleList')
        });
        var self = this;
        this.liferayArticleCollectionView.on('article:added', function(text) {
            self.trigger('article:added', text);
        });
        this.liferayArticleCollection.fetch();
    },
    submit: function () {
        if (this.liferayArticleCollectionView)
            this.liferayArticleCollectionView.submit(this.model);
    }
});