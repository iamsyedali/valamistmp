var revealControlsModule = slidesApp.module('RevealControlsModule', function (RevealControlsModule, slidesApp, Backbone, Marionette, $, _) {
    RevealControlsModule.startWithParent = false;

    RevealControlsModule.playerTitlesValue = {
        lessonSetting: 'lessonSetting',
        lesson: 'lesson',
        page: 'page',
        empty: 'empty'
    };

    RevealControlsModule.View = Marionette.ItemView.extend({
        template: '#revealControlsTemplate',
        id: 'slideset-controls',
        ui: {
            buttons_add_page: '.js-add-page',
            button_add_page_right: '.js-add-page.right',
            button_add_page_down: '.js-add-page.down'
        },
        events: {
            'click @ui.buttons_add_page': 'showTemplatePanel',
            'click .js-slide-delete': 'deleteSlide',
            'click .js-change-slide-background': 'changeBackground',
            'change #background-image-selector': 'updateBackgroundImageSize',
            'click .js-remove-background-image': 'removeBackgroundImage',
            'click .js-save-page-settings': 'savePageSettings',
            'click .js-open-page-settings': 'openPageSettings',
            'click .js-valamis-popup-button': function() { slidesApp.isEditing = true; },
            'click .js-valamis-popup-close': function() { slidesApp.isEditing = false; }
        },
        modelEvents: {
            'change': 'setPopupPanelData'
        },
        behaviors: {
            ValamisUIControls: {},
            ImageUpload: {
                'postponeLoading': false,
                'autoUpload': function() { return false; },
                'fileUploaderLayout': '.js-image-uploader',
                'getFolderId': function (model) { return (model.get('slideSetId') ? 'slide_' : 'slide_theme_') + model.get('id'); },
                'getFileUploaderUrl': function (model) {
                    return (model.get('slideSetId')
                        ? path.root + path.api.files + 'slide/' + model.get('id') + '/bg-image'
                        : path.root + path.api.files + 'slide-theme/' + model.get('id') + '/bg-image');
                },
                'uploadLogoMessage': function () { return Valamis.language['uploadLogoMessage']; },
                'selectImageModalHeader': function () { return Valamis.language['selectImageModalHeader']; },
                'fileuploaddoneCallback': function() {},
                'fileuploadaddCallback': function(context, file, data) {
                    slidesApp.activeSlideModel.set('bgImageChange', true, {silent: true});
                    context.view.triggerMethod('FileAdded', file, data);
                },
                'acceptFileTypes': function() {
                    return '(' +
                        _.reduce(Utils.getMimeTypeGroupValues('image'), function(a, b) {
                            return a + ')|(' + b;
                        }) + ')';
                },
                'fileRejectCallback': function(context) {
                    slidesApp.execute('action:undo');
                    context.view.$('.js-upload-image').click();
                    context.view.$('#slide-background-image-thumbnail').hide();
                    context.uploadImage(context);
                }
            }
        },
        initialize: function() {
            this.categories = [];
            this.verbs = [];
            this.uriCollection = new URICollection();
            this.verbUriCollection = new VerbURICollection();
            var that = this;
            that.playerTitles = [
                {value: RevealControlsModule.playerTitlesValue.lessonSetting, text: Valamis.language['lessonSettingLabel']},
                {value: RevealControlsModule.playerTitlesValue.lesson, text: Valamis.language['lessonTitleLabel']},
                {value: RevealControlsModule.playerTitlesValue.page, text: Valamis.language['valBadgePageTitle']},
                {value: RevealControlsModule.playerTitlesValue.empty, text: Valamis.language['emptyTitleLabel']}
            ];
            this.uriCollection.on('sync', function() {
                that.verbUriCollection.fetch({reset: true})
            });
            that.verbUriCollection.on('sync', function() {
                that.verbs = [];
                that.categories = [];
                that.verbUriCollection.each(function(verb) {
                    that.verbs.push({ id: verb.get('uri').slice(verb.get('uri').lastIndexOf('_') + 1),
                        text: !!(Valamis.language[verb.get('uri')])
                            ? Valamis.language[verb.get('uri')]
                            : verb.get('title') });
                });
                that.uriCollection.each(function(uri) {
                    if(uri.get('uri').indexOf(path.root + path.api.uri + 'category') != -1 && !!uri.get('content'))
                        that.categories.push({ id: uri.get('objId'), text: uri.get('content') });
                    if(uri.get('uri').indexOf(path.root + path.api.uri + 'verb') != -1 && !!uri.get('content'))
                        that.verbs.push({ id: uri.get('objId'), text: uri.get('content') });
                });
                that.initSelectize();
            });
        },
        openPageSettings: function(){
            this.$('#js-slide-title').focus();
            if (slidesApp.selectizeVerb) slidesApp.selectizeVerb.destroy();
            if (slidesApp.selectizeCategory) slidesApp.selectizeCategory.destroy();
            this.uriCollection.fetch({reset: true});
            revealControlsModule.initPageSettings();
        },
        setPopupPanelData: function(){
            // ChangeBackgroundImagePanel
            var src = $(Reveal.getCurrentSlide()).attr('data-background');
            var size = $(Reveal.getCurrentSlide()).attr('data-background-size') || 'cover';
            this.$('#slide-background-image-thumbnail').css({
                'display': (src) ? 'block' : 'none',
                'background-image': (src) ? 'url("' + src + '")' : ''
            });
            this.$('#background-image-selector').val(size);
        },
        showTemplatePanel: function (e){
            var isDownDirection = $(e.target).closest('button').hasClass('down');
            slidesApp.commands.execute('controls:templates:show', isDownDirection);

        },
        addPage: function (e) {
            var direction = $(e.target).closest('.js-add-page').attr('data-value');
            clearTimeout(this.slideTemplateShowTimeout);
            slidesApp.execute('reveal:page:add', direction);
            valamisApp.execute('modal:close');
        },
        deleteSlide: function() {
            slidesApp.activeSlideModel.set('toBeRemoved', true);
        },
        onFileAdded: function (file, data) {
            slidesApp.historyManager.groupOpenNext();
            var fileUrl = (typeof file === 'string')
                ? file
                : createObjectURL(file);

            slidesApp.activeSlideModel
                .set({fileUrl: fileUrl, fileModel: data})
                .unset('slideId');

            if(typeof file === 'object')
                slidesApp.activeSlideModel.set('formData', data);

            var bgSize = this.$('#background-image-selector').val() || 'cover';
            this.bgImageUpdate(fileUrl, bgSize);

            this.$el.find('.js-valamis-popup-panel').hide();
            slidesApp.historyManager.groupClose();
            valamisApp.execute('modal:clear');
        },
        updateBackgroundImageSize: function () {
            if(slidesApp.activeSlideModel.get('bgImage')) {
                var bgImageName = slidesApp.activeSlideModel.get('bgImage').split(' ')[0];
                var bgImageSize = this.$('#background-image-selector').val();
                slidesApp.activeSlideModel.set('bgImage', bgImageName + ' ' + bgImageSize);
                this.bgImageUpdate(bgImageName, bgImageSize);
                slidesApp.activeSlideModel.set('bgImageSizeChange', true, {silent: true})
            }
        },
        removeBackgroundImage: function () {
            if(slidesApp.activeSlideModel.get('bgImage')) {
                slidesApp.activeSlideModel
                    .unset('bgImage')
                    .unset('formData')
                    .unset('fileModel')
                    .unset('fileUrl');
                this.bgImageUpdate('', '');
                slidesApp.activeSlideModel.set('bgImageSizeChange', true, {silent: true});
                slidesApp.activeSlideModel.set('bgImageChange', true, {silent: true});
            }
        },
        bgImageUpdate: function(image, size) {
            var src = (image.indexOf('/') == -1)
                ? slidesApp.getFileUrl(slidesApp.activeSlideModel, image)
                : image;

            slidesApp.activeSlideModel.set('bgImage', (image && size) ? (image + ' ' + size) : '');

            this.$('#slide-background-image-thumbnail').css({
                'display': image ? 'block' : 'none',
                'background-image': image ? 'url("' + src + '")' : ''
            });
        },
        initSelectize: function() {
            var that = this;
            slidesApp.selectizeVerb = that.$('#page-statement-verb-selector').selectize({
                delimiter: ',',
                persist: false,
                valueField: 'id',
                options: that.verbs,
                create: true,
                createOnBlur: true,
                sortField: 'text'
            })[0].selectize;
            slidesApp.selectizeCategory = that.$('#page-statement-category-selector').selectize({
                delimiter: ',',
                persist: false,
                valueField: 'id',
                options: that.categories,
                create: true,
                createOnBlur: true,
                sortField: 'text'
            })[0].selectize;
            slidesApp.pagePlayerTitle = that.$('#js-page-player-title').selectize({
                delimiter: ',',
                persist: false,
                valueField: 'value',
                options: this.playerTitles
            })[0].selectize;
            slidesApp.selectizeVerb.setValue(slidesApp.activeSlideModel.get('statementVerb') || 'http://adlnet.gov/expapi/verbs/experienced');
            slidesApp.selectizeCategory.setValue(slidesApp.activeSlideModel.get('statementCategoryId'));
            slidesApp.pagePlayerTitle.setValue(slidesApp.activeSlideModel.get('playerTitle') || 'lessonSetting');
        },
        openSlideTemplatesPanel: function (isDirectionDown) {
            var PAGE_LABEL_POSTFIX = 'PageLabel';
            var classList = 'lesson-studio-modal slide-templates-modal light-val-modal overflow-visible';
            var blankSlide = new lessonStudio.Entities.LessonPageTemplateModel({'title': Valamis.language['blankPageLabel']});
            var templateCollection = new lessonStudio.Entities.LessonPageCollection(blankSlide);
            var slideElements = slidesApp.activeSlideModel.getSlideElementsFromCollection();
            var isRandom = _.find(slideElements, function (el) {
                    return el.get('slideEntityType') == 'randomquestion'
                }
            );
            if (!isRandom) {
                var copySlide = new lessonStudio.Entities.LessonPageTemplateModel(slidesApp.activeSlideModel.attributes);
                copySlide
                    .set('isSlideCopy', true)
                    .set('bgImage', 'copy-slide.png')
                    .set('title', Valamis.language['copyPageLabel'])
                    .set('oldBgImage', slidesApp.activeSlideModel.get('bgImage'));
                templateCollection.add(copySlide);
            }
            templateCollection.add(slidesApp.slideTemplateCollection.models);
            templateCollection.add(slidesApp.slideTemplateCollection.models.map(function(e){
                var langKey = Utils.getLangKey(e.get('title'), PAGE_LABEL_POSTFIX);
                if(!!Valamis.language[langKey])
                    e.set('title', Valamis.language[langKey]);
                return e;
            }));
            classList += ' ' + (isDirectionDown ? 'downPosition' : 'rightPosition');
            var templatesView = new RevealControlsModule.SlideTemplatesGridView({
                collection: templateCollection,
                isDirectionDown: isDirectionDown
            });
            templatesView.on('template:select', function () {
                valamisApp.execute('modal:close', templatesView);
            });
            var view = new valamisApp.Views.ModalView({
                contentView: templatesView,
                className: classList,
                header: Valamis.language['selectTemplateLabel']
            });
            valamisApp.execute('modal:show', view);

        },
        openSlideThemeEditPanel: function() {
            var classList = 'lesson-studio-modal slide-theme-modal-view light-val-modal';

            if(!themeCollection)
                themeCollection = new lessonStudio.Entities.LessonPageThemeCollection();

            themeCollection.mode = 'default';

            var themeView = new RevealControlsModule.ThemeGridView({collection: themeCollection});
            var view = new valamisApp.Views.ModalView({
                contentView: themeView,
                className: classList,
                header: Valamis.language['selectThemeHeader'],
                onDestroy: function(){
                    slidesApp.topbar.currentView.ui.button_change_theme
                        .removeClass('highlight');
                }
            });

            valamisApp.execute('modal:show', view);

            themeView.on('show', function(){
                slidesApp.execute('controls:themes:fetch');
            });

            themeView.on('theme:select', function (theme) {
                slidesApp.themeModel = theme;
                slidesApp.execute('reveal:page:applyTheme');
                valamisApp.execute('modal:close', themeView);
            });

        },
        openSlideThemeSaveModal: function () {
            this.$('.slide-popup-panel').hide();
            var themeAddModal = new RevealControlsModule.ThemeAddView({
                model: new lessonStudio.Entities.LessonPageThemeModel()
            });
            var view = new valamisApp.Views.ModalView({
                contentView: themeAddModal,
                className: 'valamis-slides val-modal',
                header: Valamis.language['addThemeHeader']
            });
            valamisApp.execute('modal:show', view);

            themeAddModal.on('theme:create', function (theme) {
                var themeOptions = {
                    themeType: themeCollection.mode,
                    slideId : slidesApp.activeSlideModel.get('id')
                };
                var formData = theme.get('formData');
                var bgSize = theme.getBackgroundSize();
                theme.unset('formData');

                theme.save(null, themeOptions).then(
                    function (newThemeModel) {
                        theme.set('id', newThemeModel.id);

                        slidesApp
                            .uploadFile(theme, revealControlsModule.view.behaviors.ImageUpload.getFileUploaderUrl, formData, bgSize)
                            .always(fetchThemes);

                        function fetchThemes() {
                            slidesApp.execute('controls:themes:fetch');
                            valamisApp.execute('notify', 'success', Valamis.language['themeSavedLabel']);
                        }
                    },
                    function () {
                        valamisApp.execute('notify', 'error', Valamis.language['themeSaveErrorLabel']);
                    }
                );
                valamisApp.execute('modal:close', view);
            });
        },
        fetchThemes: function(){

            var modalView = valamisApp.mainRegion.currentView.modals.currentView;
            modalView.contentView.ui.theme_container
                .empty()
                .addClass('loading-container');

            modalView.contentView.ui.controls_buttons
                .removeClass('active')
                .filter('[data-mode="' + themeCollection.mode + '"]')
                .addClass('active');

            themeCollection.fetch({
                reset: true,
                success: function (collection) {

                    modalView.contentView.ui.theme_container
                        .removeClass('loading-container');

                    var canCreate = true;
                    if( collection.mode == 'default' || (!Valamis.permissions.LessonStudio.CAN_EDIT_THEME) ){
                        canCreate = false;
                    }

                    if( canCreate ){

                        collection.add({
                            title: Valamis.language.saveCurrentThemeLabel,
                            type: 'item-button',
                            bgColor: '#eaeaea',
                            bgImage: '',
                            font: "'Helvetica Neue' Helvetica sans-serif$14px$#1c1c1c$"
                        },{at: 0});

                    }

                }
            });
        },
        saveSlideTemplate: function() {
            slidesApp.activeSlideModel
                .saveTemplate({ slideSetId: 0 })
                .then(
                    function() {
                        valamisApp.execute('notify', 'success', Valamis.language['pageTemplateSavedLabel']);
                    },
                    function () {
                        valamisApp.execute('notify', 'error', Valamis.language['pageTemplateSaveErrorLabel']);
                    }
                );
        },
        savePageSettings: function(e){
            slidesApp.isEditing = false;
            slidesApp.viewId = this.cid;
            slidesApp.actionType = 'pageSettingsChanged';
            slidesApp.oldValue = {
                indices: Reveal.getIndices(),
                title: slidesApp.activeSlideModel.get('title'),
                statementVerb: slidesApp.activeSlideModel.get('statementVerb'),
                statementObject: slidesApp.activeSlideModel.get('statementObject'),
                statementCategoryId: slidesApp.activeSlideModel.get('statementCategoryId'),
                duration: slidesApp.activeSlideModel.get('duration'),
                playerTitle: slidesApp.activeSlideModel.get('playerTitle')
            };
            var verb = this.$('#page-statement-verb-selector').val() || undefined,
                category = this.$('#page-statement-category-selector').val();
            slidesApp.activeSlideModel.set({
                'title': (this.$('#js-slide-title').val() === '' ? this.$('#js-slide-title').attr('placeholder') : this.$('#js-slide-title').val()),
                'statementVerb': verb,
                'statementObject': this.$('#js-slide-statement-object').val(),
                'statementCategoryId': category,
                'duration': this.$('#js-slide-time-picker').val(),
                'playerTitle': this.$('#js-page-player-title').val()
            });

            // Add new option to DB and replace it's value in the dropdown list
            var that = this;
            function addURI(type) {
                var uris = type === 'verb' ? that.verbs : that.categories;
                var deferred = $.Deferred();
                var newURI = type === 'verb' ? that.$('#page-statement-verb-selector').val() : that.$('#page-statement-category-selector').val();
                if(newURI && uris.filter(function(item) { return item.id === newURI }).length == 0) {
                    var valamisURI = new ValamisURI({
                        content: newURI,
                        id: newURI,
                        type: type
                    });
                    valamisURI.save().then(function (uri) {
                        var attrName = type === 'verb' ? 'statementVerb' : 'statementCategoryId';
                        var selectize = type === 'verb' ? slidesApp.selectizeVerb : slidesApp.selectizeCategory;
                        slidesApp.activeSlideModel.set(attrName, uri.objId);
                        selectize.removeOption(newURI);
                        selectize.addOption({ id: uri.objId, text: uri.content });
                        selectize.refreshOptions();
                        deferred.resolve(uri.objId);
                    });
                } else {
                    deferred.resolve(type === 'verb' ? verb : category);
                }
                return deferred.promise();
            }

            $.when.apply($, [ addURI('verb'), addURI('category') ]).then(function() {
                slidesApp.newValue = {
                    indices: Reveal.getIndices(),
                    title: slidesApp.activeSlideModel.get('title'),
                    statementVerb: slidesApp.activeSlideModel.get('statementVerb'),
                    statementObject: slidesApp.activeSlideModel.get('statementObject'),
                    statementCategoryId: slidesApp.activeSlideModel.get('statementCategoryId'),
                    duration: slidesApp.activeSlideModel.get('duration'),
                    playerTitle: slidesApp.activeSlideModel.get('playerTitle')
                };
                slidesApp.execute('action:push');
            });
            $(e.target).parents('.js-valamis-popup-panel').hide();
            $(e.target).parents('.bootstrap-timepicker-widget').hide();
        },
        openSettingsPanel: function(){
            var classList = 'lesson-studio-modal slide-settings-modal light-val-modal';
            var settingsModal = new RevealControlsModule.SlideSettingsView({
                model: slidesApp.slideSetModel,
                collection: slidesApp.devicesCollection
            });
            var view = new valamisApp.Views.ModalView({
                contentView: settingsModal,
                className: classList,
                header: Valamis.language['settingsLabel'],
                onDestroy: function(){
                    slidesApp.isEditing = false;
                    slidesApp.topbar.currentView.ui.button_change_settings
                        .removeClass('highlight');
                }
            });
            valamisApp.execute('modal:show', view);

            settingsModal.on('settings:save', function () {
                valamisApp.execute('modal:close', view);
            });
        },
        updateTopDownNavigation: function(showAddPageButton) {
            this.ui.button_add_page_down.toggleClass('hidden', !showAddPageButton);
        }
    });

    RevealControlsModule.onStart = function() {
        revealControlsModule.view = new revealControlsModule.View({
            model: new lessonStudio.Entities.LessonPageTemplateModel()
        });
        slidesApp.revealControls.show(revealControlsModule.view);
        revealControlsModule.view.$('.valamis-tooltip')
            .tooltip({
                container: revealControlsModule.view.el,
                placement: function(){
                    if( this.$element.data('placement') ){
                        return this.$element.data('placement');
                    }
                    return $(window.parent).width() >= 1500
                        ? 'right'
                        : 'left';
                },
                trigger: 'hover'
            })
            .on('inserted.bs.tooltip', function(){
                $(this).data('bs.tooltip').$tip
                    .css({
                        whiteSpace: 'nowrap'
                    });
            })
            .bind('click',function(){
                $(this).tooltip('hide');
            });

        revealControlsModule.view.$('.js-add-page')
            .tooltip({
                container: revealControlsModule.view.$el.parent(),
                trigger: 'hover'
            })
            .on('inserted.bs.tooltip', function () {
                $(this).data('bs.tooltip').$tip
                    .css({
                        whiteSpace: 'nowrap'
                    });
            })
            .bind('click',function(){
                $(this).tooltip('hide');
            });

        $(lessonStudio.slidesWrapper + ' .js-change-slide-background').colpick({
            layout: 'hex',
            container: '.slideset-editor',
            submit: 0,
            onHide: function (colpkr) {
                slidesApp.isEditing = false;
                RevealControlsModule.pickerVisible = false;
                var slide = $(Reveal.getCurrentSlide());
                var value =  slide.attr('data-background-color');

                slide.attr('data-background-color', RevealControlsModule.oldValue);
                slidesApp.activeSlideModel.set('bgColor', value);

                Reveal.configure({backgroundTransition: RevealControlsModule.oldBackgroundTransition}); //Return transition back
            },
            onChange: function(hsb, hex, rgb, el, isManual) {
                $(el).val(hex);
                if( !isManual ){
                    $(Reveal.getCurrentSlide()).attr('data-background-color', '#'+hex);
                    Reveal.sync();
                }
            },
            onBeforeShow: function (colpkr) {
                $(lessonStudio.slidesWrapper + ' .slide-popup-panel').hide();
                $(this).colpickSetColor($(Reveal.getCurrentSlide()).attr('data-background-color') || '#EAEAEA');

                var slide = $(Reveal.getCurrentSlide()); //To escape flashes while moving colorpicker pointer
                RevealControlsModule.oldBackgroundTransition = Reveal.getConfig().backgroundTransition;
                Reveal.configure({backgroundTransition: 'none'});

                RevealControlsModule.oldValue = slide.attr('data-background-color');
            },
            onShow: function (colpkr) {
                if ($(colpkr).css('display') == 'block') {
                    $(colpkr).css('display','none');
                    return false;
                }
                slidesApp.isEditing = true;
                RevealControlsModule.pickerVisible = true;
                var button = $(this),
                    clientRect = button.get(0).getBoundingClientRect();
                $(colpkr).css({
                    'position': 'absolute',
                    'left': (clientRect.left - $(colpkr).width() - 13),
                    'top': clientRect.top,
                    'display': 'block',
                    'z-index': 500
                });
            }
        });
        slidesApp.commands.setHandler('controls:theme:change', revealControlsModule.view.openSlideThemeEditPanel);
        slidesApp.commands.setHandler('controls:templates:show', revealControlsModule.view.openSlideTemplatesPanel);
        slidesApp.commands.setHandler('controls:theme:save', revealControlsModule.view.openSlideThemeSaveModal);
        slidesApp.commands.setHandler('controls:themes:fetch', revealControlsModule.view.fetchThemes);
        slidesApp.commands.setHandler('controls:settings:change', revealControlsModule.view.openSettingsPanel);
    };

    RevealControlsModule.initPageSettings = function() {
        var title = slidesApp.activeSlideModel.get('title') ? decodeURIComponent(slidesApp.activeSlideModel.get('title')) : '';
        $(lessonStudio.slidesWrapper + ' #js-slide-title').val(title);
        $(lessonStudio.slidesWrapper + ' #js-slide-statement-object').val(
            slidesApp.activeSlideModel.get('statementObject') || title
        );
        var duration = slidesApp.activeSlideModel.get('duration') || '0:00';
        $(lessonStudio.slidesWrapper + ' #js-slide-time-picker').timepicker({
            appendWidgetTo: '.slideset-editor',
            defaultTime: duration,
            showMeridian: false,
            minuteStep: 5
        }).val(duration);
    };

    RevealControlsModule.ThemeAddView = Marionette.ItemView.extend({
        model: lessonStudio.Entities.LessonPageThemeModel,
        template: '#themeAddViewTemplate',
        events: {
            'click .js-save': 'saveTheme'
        },
        templateHelpers: function() {
            var slideModel = slidesApp.activeSlideModel;
            this.fonts = this.findFonts(slideModel);
            return {
                fonts: this.fonts,
                oneFont: this.fonts.length == 1
            }
        },
        initialize: function() {

        },
        onRender: function () {
            this.$('#js-slide-theme-font option').first().attr('selected', true);
        },
        saveTheme: function() {
            var that = this;
            var slideModel = slidesApp.activeSlideModel;
            var bgImage = slideModel.get('bgImage');
            if (bgImage) {
                //image from media gallery
                if (bgImage.indexOf('/documents') == 0) {
                    this.model.copyImageFromGallery(slideModel.get('fileModel'), slideModel.getBackgroundSize());
                    that.createTheme(slideModel);
                }
                else if(bgImage.indexOf('blob:') == 0){
                    this.model.set({
                        bgImage: bgImage,
                        formData: slideModel.get('formData')
                    });
                    that.createTheme(slideModel);
                }
                //image was already saved
                else {
                    this.model.copyBgImage(slideModel.getId(), function() {
                        that.createTheme(slideModel);
                    });
                }
            }
            else {
                this.createTheme(slideModel);
            }
        },
        createTheme: function(slideModel) {
            var font = (this.fonts.length == 1) ? this.fonts[0] : this.fonts[this.$('#js-slide-theme-font :selected').index()];
            this.model.set({
                title: this.$('#js-slide-theme-title').val(),
                questionFont: slideModel.get('questionFont'),
                answerFont: slideModel.get('answerFont'),
                answerBg: slideModel.get('answerBg'),
                bgColor: slideModel.get('bgColor'),
                font: font.family + '$' + font.size + '$' + font.color
            });

            this.trigger('theme:create', this.model);
        },
        findFonts: function (model) {
            var slide = $(lessonStudio.slidesWrapper + ' #slide_' + model.id).length > 0
                ? $(lessonStudio.slidesWrapper + ' #slide_' + model.id)
                : $(lessonStudio.slidesWrapper + ' #slide_' + model.get('tempId'));
            var textElements = _.filter(slidesApp.slideElementCollection.models, function (el) {
                return  (el.get('slideId') == model.get('id')
                    || el.get('slideId') == model.get('tempId'))
                    &&  el.get('slideEntityType') == 'text' && !el.get('toBeRemoved')
            });
            var slideElements = _.map(textElements, function (el) {
                return slide.find(' #slideEntity_' + (el.id || el.get('tempId')) + ' > .item-content')
            });

            var styles = [];

            _.each(slideElements, function (el) {
                var elements = $(el).find("*:not(:has(*))"); //Find all inner elements without children

                _.each(elements, function (el) {
                    el = $(el);
                    var style = {
                        size: el.css('font-size'),
                        family: el.css('font-family'),
                        color: el.css('color'),
                        name: el.css('font-family').split(',')[0].replace(/['"]+/g, ''),
                        bgColor: el.css('background-color')
                    };
                    styles.push(style);
                });
            });

            if (styles.length != 1 && slide.css('font-family')){
                styles.push({
                        size: slide.css('font-size'),
                        family: slide.css('font-family'),
                        color: slide.css('color'),
                        name: slide.css('font-family').split(',')[0].replace(/['"]+/g, ''),
                        bgColor: slide.css('background-color')
                    });
            }
            return _.uniq(styles, 'name');
        }
    });

    var themeCollection;
    RevealControlsModule.ThemeView = Marionette.ItemView.extend({
        template: '#themePreviewItemTemplate',
        className: 'preview s-4 tile',
        events: {
            'click': 'selectTheme',
            'click .js-action-delete': "deleteTheme"
        },
        templateHelpers: function() {
            var THEME_LABEL_POSTFIX = 'ThemeLabel';
            var isButton = this.model.get('type') == 'item-button';
            var isSelected = slidesApp.slideSetModel.get('themeId') && this.model.get('id') == slidesApp.slideSetModel.get('themeId');
            var canDelete = (themeCollection.mode == 'default' || (themeCollection.mode == 'public' && !Valamis.permissions.LessonStudio.CAN_EDIT_THEME))
                ? false
                : !isButton;
            var srcImage = slidesApp.getFileUrl(this.model, this.model.getBackgroundImageName());
            var langKey = Utils.getLangKey(this.model.get('title'), THEME_LABEL_POSTFIX);
            return {
                isButton: isButton,
                canDelete: canDelete,
                canUnlockLesson: Valamis.permissions.LessonStudio.CAN_UNLOCK_LESSON,
                isSelected: isSelected,
                srcImage: srcImage,
                titleThemeLabel: !!(Valamis.language[langKey])
                    ? Valamis.language[langKey]
                    : this.model.get('title')
            }
        },
        onRender: function () {
            //To make icon visible on dark bgs
            if(this.colorBrightness() < 128)
                this.el.classList.add('has-dark-background');
            if (slidesApp.slideSetModel.get('themeId')
                && this.model.get('id') == slidesApp.slideSetModel.get('themeId')){
                this.$el
                    .find('.js-background')
                    .addClass('active')
            }
        },
        colorBrightness: function () {
            if(!this.model.get('bgColor'))
                return 255;

            var bgColor = $.colpick.hexToRgb(this.model.get('bgColor'));
            return (bgColor.r * 299 + bgColor.g * 587 + bgColor.b * 114) / 1000;
        },
        selectTheme: function() {
            if( this.$('.item-button').length > 0 ){
                slidesApp.execute('controls:theme:save');
            }
            else {
                this.trigger('theme:select', this.model);
            }
        },
        deleteTheme: function (ev) {
            this.model.destroy();
            ev.stopPropagation();
        }
    });

    RevealControlsModule.SlideTemplatesView = Marionette.ItemView.extend({
        template: '#slideTemplatesPreviewItemTemplate',
        className: 'preview s-6 tile',
        templateHelpers: function() {
            var bgImage = this.model.get('bgImage');
            var bgImageType = bgImage.substr(0, bgImage.lastIndexOf('.'));
            return {
                bgImageType: bgImageType
            }
        },
        events: {
            'click': 'selectTemplate'
        },
        selectTemplate: function () {
            this.trigger('template:select', this.model);
        }
    });

    RevealControlsModule.ThemeGridView = Marionette.CompositeView.extend({
        template: '#themePreviewWrapperTemplate',
        className: 'slide-theme-modal',
        childView: RevealControlsModule.ThemeView,
        childViewContainer: '#theme-container',
        ui: {
            controls_buttons: '.js-themes-controls button',
            theme_container: '#theme-container'
        },
        events: {
            'click @ui.controls_buttons': 'loadThemes'
        },
        childEvents: {
            'theme:select': 'selectTheme'
        },
        initialize: function(options) {
            this.collection = options.collection;
        },
        onShow: function () {
            var buttonOffset = slidesApp.topbar.currentView.ui.button_change_theme.offset(),
                buttonOffsetRight = $( window).width() - buttonOffset.left;
            this.$el.closest('.bbm-wrapper')
                .find('.bbm-modal,.modal-content')
                .css('overflow','visible');
            this.$el.closest('.bbm-modal')
                .css({
                    height: 'auto',
                    position: 'absolute',
                    right: buttonOffsetRight - 40,
                    top: 60
                });
            this.trigger('show');
        },
        loadThemes: function(e){
            e.preventDefault();

            var button = $(e.target),
                mode = button.data('mode');

            if( mode == this.collection.mode ){
                return;
            }

            this.collection.mode = mode;
            slidesApp.execute('controls:themes:fetch');

        },
        selectTheme: function (view, model) {
            this.trigger('theme:select', model);
        }
    });

    RevealControlsModule.SlideTemplatesGridView = Marionette.CompositeView.extend({
        template: '#slideTemplatesPreviewTemplate',
        childView: RevealControlsModule.SlideTemplatesView,
        childViewContainer: '#slide-templates-container',
        childEvents: {
            'template:select': 'selectTemplate'
        },
        initialize: function(options) {
            this.template = _.template(Mustache.to_html($(this.template).html(), Valamis.language));
            this.collection = options.collection;
            this.isDirectionDown = options.isDirectionDown;
        },
        onShow: function () {
            window.placeTemplateModal($(window).width(), $(window).height(), this.isDirectionDown);
        },
        selectTemplate: function (view, model) {
            var that = this;
            var newSlideModel = new lessonStudio.Entities.LessonPageModel(model.attributes)
                .unset('isTemplate')
                // Setting "slideId" because "id" causes conflicts with copying slide created from template
                // and overall using "slideId" is better than "id"
                .unset('id')
                .set('slideId', !model.get('isTemplate') ? (model.get('id') || model.get('slideId')) : null)
                .set('slideSetId', slidesApp.slideSetModel.get('id'))
                .set({ tempId: slidesApp.newSlideId--});

            var bgImage = newSlideModel.get('oldBgImage');
            //means that image was saved
            if(bgImage && bgImage.indexOf('blob:') == -1 && bgImage.indexOf('/documents/') == -1 ){
                newSlideModel.copyBgImage(newSlideModel.get('slideId'), function() {
                    that.createTemplate(model, newSlideModel);
                    that.trigger('template:select');
                });
            }
            else {
                this.setBgImage(newSlideModel);
                this.createTemplate(model, newSlideModel);
                this.trigger('template:select');
            }
        },
        setBgImage: function (model) {
            var originalBgImage = model.get('originalBgImageName');//if ppt/pdf is on the slide
            var fileUrl = model.get('fileUrl');
            var oldBgImage = model.get('oldBgImage');
            if (originalBgImage && fileUrl) {
                var bgSize = originalBgImage.split(' ')[1];
                model.set('bgImage', fileUrl + ' '+ bgSize);
            }
            else if(oldBgImage) {
                model.set('bgImage', oldBgImage);
            }
            else {
                model.unset('bgImage');
            }
        },
        createTemplate: function (model, newSlideModel) {
            var slideElements;
            var newSlideElements = new lessonStudioCollections.LessonPageElementCollection();
            slidesApp.historyManager.groupOpenNext();

            if (model.get('isTemplate'))
                slideElements  = new lessonStudioCollections.LessonPageElementCollection(newSlideModel.get('slideElements'));
            else {
                slideElements = model.get('slideElements') || new lessonStudioCollections.LessonPageElementCollection();

                if (!(slideElements instanceof Backbone.Collection)) {
                    slideElements = new lessonStudioCollections.LessonPageElementCollection(slideElements);
                }
            }

            slideElements.each(function (slideElement) {
                //we have to omit id attribute here for correct work of undo/redo mechanism
                //as history manager will ignore changing of id attribute if we do it after placing model to the
                //history collection
                //(because of using skipAttributes: id when call slidesApp.historyManager.pushModelChange
                // in LessonPageModel's "add change" event handler)
                var newSlideElement = new lessonStudio.Entities.LessonPageElementModel(_.omit(slideElement.attributes, 'id', 'slideId'));

                newSlideElement.set('tempId', slidesApp.newSlideElementId--);
                newSlideElement.set('slideId', newSlideModel.get('tempId'));

                if (!model.get('isTemplate')
                    && _.contains(['image', 'webgl', 'pdf', 'audio'], newSlideElement.get('slideEntityType'))) {
                    if (newSlideElement.get('content') && newSlideElement.get('content').indexOf('/') == -1) {
                        newSlideModel
                            .set('fromTemplate', false);
                        newSlideElement
                            .set('clonedId', (slideElement.get('id') || slideElement.get('clonedId')));
                        slidesApp.copyFileContent(newSlideElement);
                    }
                    newSlideElement.copyImageFromGallery(newSlideElement.get('fileModel'));
                }

                if( model.get('isTemplate') ){
                    var properties = newSlideElement.get('properties');
                    if(newSlideElement.get('slideEntityType') == 'text'){
                        newSlideElement.set('fontSize', '16px');
                        if( !_.isEmpty(properties[1]) ){
                            properties[1].fontSize = '16px';
                            newSlideElement.set('properties', properties);
                        }
                    }
                    var deviceLayoutCurrentId = slidesApp.devicesCollection.getCurrentId();
                    if(!properties[deviceLayoutCurrentId]){
                        //Set properties for current device
                        var layoutProperties = newSlideElement.getLayoutProperties(1),
                            layoutSizeRatio = slidesApp.devicesCollection.getSizeRatio(1, deviceLayoutCurrentId);
                        newSlideElement.set(layoutProperties, {silent: true});
                        layoutProperties = newSlideElement.getLayoutProperties(deviceLayoutCurrentId, layoutSizeRatio);
                        newSlideElement.updateProperties(layoutProperties);
                    }
                }
                newSlideElements.add(newSlideElement);
            });

            newSlideModel.set('slideElements', newSlideElements);

            slidesApp.execute('reveal:page:add', (this.isDirectionDown ? 'down' : 'right'), newSlideModel);

            slidesApp.checkIsTemplate();
            slidesApp.historyManager.groupClose();
        }
    });

    RevealControlsModule.SlideSettingsView = Marionette.CompositeView.extend({
        DEFAULT_SCORE: 0.7,
        template: '#slideSettingsTemplate',
        childView: lessonStudio.Views.DeviceItemView,
        childViewContainer: '.devices-list',
        events: {
            'click .js-save-settings': 'saveSetting',
            'click .js-duration-checkbox': 'showDuration'
        },
        templateHelpers: function() {
            var hasRandomQuestions = slidesApp.slideSetModel.get('randomQuestionsAmount');
            var hasVerticalSlides = (slidesApp.slideCollection.filter(function(item) {
                return item.get('topSlideId') !== undefined && !item.get('toBeRemoved')
            }).length > 0);
            return {
                hasRandomQuestions: hasRandomQuestions,
                isSetDuration: this.model.get('duration') != null,
                isTopDownEnabled: !!(this.model.get('topDownNavigation')),
                hasVerticalSlides: hasVerticalSlides,
                isOneAnswerAttempt: this.model.get('oneAnswerAttempt')
            }
        },
        initialize: function(){
            this.playerTitles = [
                {value: RevealControlsModule.playerTitlesValue.lesson, text: Valamis.language['lessonTitleLabel']},
                {value: RevealControlsModule.playerTitlesValue.page, text: Valamis.language['valBadgePageTitle']},
                {value: RevealControlsModule.playerTitlesValue.empty, text: Valamis.language['emptyTitleLabel']}
            ];
        },
        onRender: function () {
            this.$('.js-slide-set-duration').timepicker({
                appendWidgetTo: '.valamis-slides',
                defaultTime: false,
                showMeridian: false,
                minuteStep: 5
            });
            this.setDuration();
            this.$('.js-plus-minus').valamisPlusMinus({
                min: 0, max: 1, step: 0.05, allowFloat: true
            });
            this.$('.js-plus-minus').valamisPlusMinus('value', this.model.get('scoreLimit') || this.DEFAULT_SCORE);

            slidesApp.playerTitle = this.$('#js-player-title').selectize({
                delimiter: ',',
                persist: false,
                valueField: 'value',
                options: this.playerTitles
            })[0].selectize;
            slidesApp.playerTitle.setValue(slidesApp.slideSetModel.get('playerTitle') || 'page');
        },
        saveSetting: function () {
            var selectedDevicesIds = this.$childViewContainer.find('li.active')
                .map(function(){
                    return $(this).data('id');
                });
            this.collection.updateSelectedModels(selectedDevicesIds);

            var isTopDownEnabled = this.$('.js-topdown-checkbox').is(':checked');
            revealControlsModule.view.updateTopDownNavigation(isTopDownEnabled);

            var isSelectedContinuity = this.$('#canPauseOption').is(':checked');
            var isSetDuration = this.$('#durationOption').is(':checked');
            if (isSetDuration) var duration = this.getDurationInMinutes();
            var isOneAnswerAttempt = this.$('.js-answerAttempt-checkbox').is(':checked');
            var isRequiredReview = this.$('.js-required-review-checkbox').is(':checked')
            this.model.set({
                isSelectedContinuity: isSelectedContinuity,
                duration: duration,
                scoreLimit: this.$('.js-plus-minus').valamisPlusMinus('value'),
                playerTitle: this.$('#js-player-title').val(),
                topDownNavigation: isTopDownEnabled,
                oneAnswerAttempt: isOneAnswerAttempt,
                requiredReview: isRequiredReview
            });
            var that = this;
            that.model.save();
            this.trigger('settings:save');
        },
        showDuration: function (){
            var picker = this.$('#timepicker');
            var isSetDuration = this.$('#durationOption').is(':checked');
            picker.toggleClass('hidden', !isSetDuration);
            if (isSetDuration) this.setDuration();
        },
        getDurationInMinutes: function(){
            var durationText = this.$('.js-slide-set-duration').val().split(':');
            var hours = parseInt(durationText[0]);
            var minutes = parseInt(durationText[1]);

            return hours * 60 + minutes;
        },
        setDuration: function (){
            var duration = '0:00';
            if(this.model.get('duration') != null) {
                var hours = Math.floor(this.model.get('duration') / 60);
                var minutes = this.model.get('duration') % 60;
                duration = hours + ':' + minutes;
            }
            this.$('.js-slide-set-duration').timepicker('setTime', duration);
        },
        onShow: function () {
            var buttonOffset = slidesApp.topbar.currentView.ui.button_change_settings.offset(),
                buttonOffsetLeft = buttonOffset.left
                    + slidesApp.topbar.currentView.ui.button_change_settings.outerWidth()/2
                    - this.$el.closest('.bbm-modal--open').outerWidth()
                    + this.$('.arrow-up').outerWidth(true)/2
                    + parseInt(this.$('.arrow-up').css('right'), 10);

            this.$el.closest('.bbm-wrapper')
                .find('.modal-content')
                .addClass('show');
            this.$el.closest('.bbm-modal')
                .addClass('show')
                .css({
                    left: buttonOffsetLeft
                });
        }

    });
});
