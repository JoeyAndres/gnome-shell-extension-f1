const Gio = imports.gi.Gio;
const Lang = imports.lang;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Soup = imports.gi.Soup;

const ICALLib = Me.imports.ical;
const ICAL = ICALLib.ICAL;
const momentLib = Me.imports.moment;
const moment = momentLib.moment;


let _httpSession;

var F1Event = new Lang.Class({
    Name: 'F1Event',

    _init: function(cfg) {
        this.summary = cfg.summary;

        let summaryComponents = this.summary.split('-');

        this.name = summaryComponents[0].trim();
        this.session = summaryComponents[1].trim();
        this.sessionShortName = this._sessionShortName(this.session);

        this.startDateTime = cfg.startDateTime;
        this.endDateTime = cfg.endDateTime;
    },

    delta() {
        return moment.duration(this.startDateTime.diff(moment()), 'ms');
    },

    _sessionShortName: function(sessionName) {
        if (sessionName.match(/first practice/i).length) {
            return 'FP1';
        } else if (sessionName.match(/second practice/i).length) {
            return 'FP2';
        } else if (sessionName.match(/third practice/i).length) {
            return 'FP3';
        } else if (sessionName.match(/qualifying/i).length) {
            return 'Qualifying';
        } else if (sessionName.match(/grand prix/i).length) {
            return 'Race';
        } else {
            // If there is an abberation, have something ambiguous.
            return 'Grand Prix';
        }
    }
});

var F1 = new Lang.Class({
    Name: 'F1',

    _init: function() {
        this.user_agent = Me.metadata.uuid;
    },

    destroy: function() {

    },

    _httpGet: function(url, params, fun) {
        if (_httpSession === undefined) {
            _httpSession = new Soup.Session();
            _httpSession.user_agent = this.user_agent;
        } else {
            // abort previous requests.
            _httpSession.abort();
        }

        let message = Soup.form_request_new_from_hash('GET', url, params);

        _httpSession.queue_message(message, Lang.bind(this, function(_httpSession, message) {
            try {
                if (!message.response_body.data) {
                    fun.call(this, null);
                    return;
                }

                let payload = message.response_body.data;
                fun.call(this, payload);
                return;
            } catch (e) {
                fun.call(this, null);
            }
        }));
        return;
    },

    getF1Calendar: function(fun) {
        let url = 'https://www.formula1.com/sp/static/f1/2017/calendar/ical.ics';
        this._httpGet(url, {}, Lang.bind(this, function(ical) {
            try {
                let jcalData = ICAL.parse(ical);
                var comp = new ICAL.Component(jcalData);
                fun.call(this, comp);
                return;
            } catch(e) {
                fun.call(this, null);
            }
        }));
        return;
    },

    /**
     *
     * @param maxEventCount
     */
    getCurrentEvent: function(fun) {
        this.getF1Calendar(function(icalComp) {
            if (icalComp) {
                let subComponents = icalComp.getAllSubcomponents();
                let currentDateTime = moment();
                let latestEventAhead = null;
                for (let i = subComponents.length - 1; i >= 0; i--) {
                    let subComponent = subComponents[i];
                    let startDateTime = moment(subComponent.getFirstPropertyValue('dtstart').toString());
                    let endDateTime = moment(subComponent.getFirstPropertyValue('dtend').toString());

                    if (currentDateTime.isSameOrBefore(startDateTime)) {
                        latestEventAhead = subComponent;
                    } else if (currentDateTime.isBetween(startDateTime, endDateTime)) {
                        log('between');
                    } else if (currentDateTime.isSameOrAfter(endDateTime)) {
                        break;
                    }
                }

                let startDateTime = moment(latestEventAhead.getFirstPropertyValue('dtstart').toString());
                let endDateTime = moment(latestEventAhead.getFirstPropertyValue('dtend').toString());

                let f1Event = new F1Event({
                    summary: latestEventAhead.getFirstPropertyValue('summary'),
                    startDateTime: startDateTime,
                    endDateTime: endDateTime
                });

                fun.call(this, f1Event);
            } else {
                fun.call(this, null);
            }
        });
    }
});