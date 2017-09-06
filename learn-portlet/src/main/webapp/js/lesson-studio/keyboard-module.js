/** Keyboard shortcuts */
var KeyboardModule = function(KeyboardModule, App, Backbone, Marionette, $, _) {
    this.startWithParent = false;

    var keyboard = {
        specialKeys: ['ctrl','alt','shift','meta'],
        keyMap: {
            a: 65, c: 67, d: 68, g: 71, n: 78, s: 83, v: 86, x: 88, z: 90,
            left: 37, up: 38, right: 39, down: 40,
            bspace: 8, del: 46
        },
        STEP_SIZE: 10,
        specialKeysPressed: function(e, keys){
            if(!_.isArray(keys)){
                keys = keys.split('+');
            }
            var isMac = navigator.platform.toUpperCase().indexOf('MAC') > -1;
            var pressed = [];
            $.each(this.specialKeys, function(index, k) {
                if(e[k + 'Key']) pressed.push(k);
            });
            if(isMac && e.metaKey){//on MAC replace META to CTRL
                pressed.splice(_.indexOf(pressed,'meta'), 1, 'ctrl');
            }
            return keys.length == pressed.length
                && _.isEmpty(_.difference(pressed, keys));
        },
        isPressed: function(e, hotKeys) {
            if(!_.isArray(hotKeys)){
                hotKeys = hotKeys.split('+');
            }
            var keyCode = e.which || e.keyCode,
                keys = _.difference(hotKeys, this.specialKeys),
                special = _.intersection(hotKeys, this.specialKeys);
            if(special.length > 0 && !this.specialKeysPressed(e, special)){
                return false;
            }
            if(keys.length > 0 && keyCode !== this.keyMap[ keys[0] ] ){
                return false;
            }
            return true;
        }
    };

    this.onStart = function() {
        this.bindKeys();
    };

    this.onStop = function() {
        this.unBindKeys();
    };

    this.onKeyPress = function (event) {
        if (App.mode != 'edit' || App.isEditing
            || valamisApp.mainRegion.currentView.modals.$el.find('.val-modal').length > 0) {
                return;
        }
        var keyCode = event.which || event.keyCode,
            found = false;

        var selectedElements = App.activeSlideModel.getElements().filter(function(model) {
            return model.get('active') || model.get('selected')
        });

        var view = App.activeElement.view;

        if (view) {

            if (keyboard.isPressed(event, 'ctrl+alt+c')) {// Ctrl+Alt+C
                found = true;
                App.itemCopy = view;
                valamisApp.execute('notify', 'info', Valamis.language.valBadgeStyleCopied);
            }
            if (keyboard.isPressed(event, 'ctrl+alt+v')) {// Ctrl+Alt+V
                found = true;
                if (App.itemCopy && !_.isArray(App.itemCopy)) {
                    var properties = App.itemCopy.model.copyProperties(['fontSize']);
                    view.model.mergeProperties(properties);
                }
            }
        }

        // Ctrl+D
        if (keyboard.isPressed(event, 'ctrl+d')) {
            event.preventDefault();
            var newElements =[];
            selectedElements.forEach(function(model) {
                var view = Marionette.ItemView.Registry.getByModelId(model.getId());
                App.execute('item:duplicate', view);
                newElements.push(App.activeElement.view.model);
                App.activeElement.view.$el.find('> .ui-resizable-handle').toggleClass('hidden', true);
            });
            App.activeSlideModel.updateElements(newElements, {selected: true, active: false});
        }

        // Shift+ARROWS
        if (keyboard.specialKeysPressed(event, 'shift') && (keyCode >= 37 && keyCode <= 40)) {
            found = true;
            App.historyManager.groupOpenNext();
            if (keyboard.isPressed(event, 'shift+up')) {// Shift+UP
                selectedElements.forEach(function(model) {
                    model.updateProperties({top: (model.get('top') - keyboard.STEP_SIZE)});
                });
            }
            if (keyboard.isPressed(event, 'shift+down')) {// Shift+DOWN
                selectedElements.forEach(function(model) {
                    model.updateProperties({ top: (model.get('top') + keyboard.STEP_SIZE) });
                });
            }
            if (keyboard.isPressed(event, 'shift+left')) {// Shift+LEFT
                selectedElements.forEach(function(model) {
                    model.updateProperties({ left: (model.get('left') - keyboard.STEP_SIZE) });
                });
            }
            if (keyboard.isPressed(event, 'shift+right')) {// Shift+RIGHT
                selectedElements.forEach(function(model) {
                    model.updateProperties({ left: (model.get('left') + keyboard.STEP_SIZE) });
                });
            }
            App.historyManager.groupClose();
        }
        if (keyboard.isPressed(event, 'del') || keyboard.isPressed(event, 'bspace')) {// Del | Backspace
            found = true;
            App.historyManager.groupOpenNext();
            selectedElements.forEach(function(model) {
                if (!model.isSummaryElement()) {
                    model.set('toBeRemoved', true);
                }
            });
            App.historyManager.groupClose();
        }
        if (keyboard.isPressed(event, 'ctrl+c')) {// Ctrl+C
            found = true;
            App.itemCopy = [];
            if(view){
                App.itemCopy.push(view);
            }
            selectedElements.forEach(function(model){
                var view = Marionette.ItemView.Registry.getByModelId(model.getId());
                if(view && !_.contains(App.itemCopy, view)){
                    App.itemCopy.push(view);
                }
            });
            valamisApp.execute('notify', 'info', Valamis.language.valBadgeCopied);
        }
        if (keyboard.isPressed(event, 'ctrl+v')) {// Ctrl+V
            found = true;
            var newElements =[];
            if(App.itemCopy && _.isArray(App.itemCopy)) {
                var modelPlace = App.itemCopy.length == 1 && slidesApp.activeElement.view
                    ? slidesApp.activeElement.view.model
                    : null;
                App.itemCopy.forEach(function(view){
                    App.execute('item:duplicate', view, modelPlace);
                    newElements.push(App.activeElement.view.model);
                    App.activeElement.view.$el.find('> .ui-resizable-handle').toggleClass('hidden', true);
                });
                App.activeSlideModel.updateElements(newElements, {selected: true, active: false});
            }
        }
        if (keyboard.isPressed(event, 'ctrl+z')) {// Ctrl+Z
            found = true;
            App.historyManager.apply('undo');
            App.execute('item:blur');
        }
        if (keyboard.isPressed(event, 'ctrl+x')) {// Ctrl+X
            found = true;
            App.historyManager.apply('redo');
            App.execute('item:blur');
        }
        if (keyboard.isPressed(event, 'ctrl+s')) {// Ctrl+S
            found = true;
            lessonStudio.execute('save-slideset', { close: false });
        }
        if (keyboard.isPressed(event, 'ctrl+a')) {// Ctrl+A
            found = true;
            App.activeSlideModel.updateAllElements({selected: true});
        }
        if (keyboard.isPressed(event, 'ctrl+g')) {// Ctrl+G
            found = true;
            App.gridSnapModule.displayGridToggle();
        }
        if(found){
            event.preventDefault();
        }
    };

    this.bindKeys = function () {
        $(document).bind('keydown', KeyboardModule.onKeyPress);
    };
    this.unBindKeys = function () {
        $(document).unbind('keydown', KeyboardModule.onKeyPress);
    };
};