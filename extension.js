const Clutter = imports.gi.Clutter;
const Lang = imports.lang;
const Main = imports.ui.main;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const Tweener = imports.ui.tweener;

const Convenience = Me.imports.convenience;
const F1 = Me.imports.f1;


let text, button;

function _hideHello() {
    Main.uiGroup.remove_actor(text);
    text = null;
}

function _showHello() {
    if (!text) {
        text = new St.Label({ style_class: 'helloworld-label', text: "Hello, world!" });
        Main.uiGroup.add_actor(text);
    }

    text.opacity = 255;

    let monitor = Main.layoutManager.primaryMonitor;

    text.set_position(monitor.x + Math.floor(monitor.width / 2 - text.width / 2),
                      monitor.y + Math.floor(monitor.height / 2 - text.height / 2));

    Tweener.addTween(text,
                     { opacity: 0,
                       time: 2,
                       transition: 'easeOutQuad',
                       onComplete: _hideHello });
}

const MoreInfoButton = new Lang.Class({
    Name: 'MoreInfoButton',

    Extends: PanelMenu.Button,

    _init: function() {
        this.parent(null, 'moreInfo');

        this.icon = new St.Icon({
            icon_name: 'f1-logo',
            style_class: 'system-status-icon',
            icon_size: 16
        });
        this.statusLabel = new St.Label({ text: '\u2026', y_expand: true, y_align: Clutter.ActorAlign.CENTER });
        this.f1 = new F1.F1();

        this.menu.removeAll();
        this.actor.add_actor(this.statusLabel);

        this._updateDisplays();

        this.connect('destroy', Lang.bind(this, this._onDestroy));
    },

    _onDestroy: function() {
        this.menu.removeAll();
    },

    setStatusLabel: function(text) {
        this.statusLabel.set_text(text);
    },

    _updateDisplays: function () {
        let self = this;
        this.f1.getCurrentEvent(function(event) {
            if (event) {
                self.setStatusLabel(`${event.sessionShortName} in ${event.delta().humanize()}`);
            }
        });
    }
});

function init() {
    // Convenience.initTranslations();
    Convenience.initIcons();
}

function enable() {
    button = new MoreInfoButton();
    Main.panel.addToStatusArea('moreInfo', button, 1, 'right');
}

function disable() {
    if (button) {
        button.destroy();
        button = null;
    }
}
