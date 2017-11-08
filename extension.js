const Clutter = imports.gi.Clutter;
const Lang = imports.lang;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const Tweener = imports.ui.tweener;

const Convenience = Me.imports.convenience;
const F1 = Me.imports.f1;


let text, button;

let F1EventItem = new Lang.Class({
    Name: 'F1EventItem',
    Extends: PopupMenu.PopupBaseMenuItem,

    _init: function (session, isCurrent) {
        this.parent();

        this._session = session;

        this.icon = new St.Icon({
            icon_name: isCurrent ? 'bullet-point-close' : 'bullet-point-open',
            style_class: 'system-status-icon',
            icon_size: 16
        });
        this.actor.add(this.icon);
        this.actor.add(new St.Label({text: this._session.sessionShortName}));
        this.actor.add(new St.Label({text: 'in'}));
        this.actor.add(new St.Label({text: this._session.delta().humanize()}), {align: St.Align.END});
    }
});

let MoreInfoButton = new Lang.Class({
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

        this._eventLoop = Mainloop.timeout_add_seconds(60, Lang.bind(this, function() {
            this._updateDisplays();
            return true;
        }));
    },

    _onDestroy: function() {
        Mainloop.source_remove(this._eventLoop);
        this.menu.removeAll();
    },

    setStatusLabel: function(text) {
        this.statusLabel.set_text(text);
    },

    _updateDisplays: function () {
        this.menu.removeAll();

        this.f1.getUpcomingOrCurrentWeekend(weekend => {
            let upComingOrCurrentSession = weekend.getUpComingOrCurrentSession();
            this.setStatusLabel(`${upComingOrCurrentSession.sessionShortName} in ${upComingOrCurrentSession.delta().humanize()}`);

            let headerItem = new PopupMenu.PopupBaseMenuItem();
            headerItem.actor.add(this.icon);
            headerItem.actor.add(new St.Label({text: weekend.name}), {align: St .Align.END});

            let sessionSection = new PopupMenu.PopupMenuSection("Sessions");
            sessionSection.addMenuItem(headerItem);

            weekend.sessions.forEach(session => {
                let item = new F1EventItem(
                    session,
                    session.isCurrentSession());
                sessionSection.addMenuItem(item);
            });

            this.menu.addMenuItem(sessionSection);
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
