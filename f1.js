const Gio = imports.gi.Gio;
const Lang = imports.lang;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Soup = imports.gi.Soup;

const ICAL = Me.imports.ical.ICAL;
const moment = Me.imports.moment.moment;
var F1EventFactory = Me.imports.F1Event.F1EventFactory;

let _httpSession;

var F1Weekend = new Lang.Class({
    Name: 'F1Weekend',

    _init: function (cfg) {
        this.name = cfg.name;
        this.sessions = cfg.sessions;
    },

    startDateTime() {
        return this.sessions[0].startDateTime;
    },

    endDateTime() {
        return this.sessions[this.sessions.length - 1].endDateTime;
    },

    getUpComingOrCurrentSession() {
        let currentDateTime = moment();
        let latestUpcomingOrCurrentSession = null;
        for (var i = this.sessions.length - 1; i >= 0; i--) {
            let session = this.sessions[i];

            if (currentDateTime.isSameOrBefore(session.startDateTime)) {
                latestUpcomingOrCurrentSession = session;
            } else if (currentDateTime.isBetween(session.startDateTime, session.endDateTime)) {
                return session;
            } else if (currentDateTime.isSameOrAfter(session.endDateTime)) {
                break;
            }
        }

        return latestUpcomingOrCurrentSession;
    }
});

let _f1Weekends = null;

function _chunkArray(array) {
    let rv = [];

    var i,j,temparray,chunk = 5;
    for (i=0,j=array.length; i<j; i+=chunk) {
        temparray = array.slice(i,i+chunk);
        rv.push(temparray);
    }

    return rv;
}

var F1 = new Lang.Class({
    Name: 'F1',

    _init: function() {
        this.user_agent = Me.metadata.uuid;
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
    getUpcomingOrCurrentWeekend: function(fun) {
        if (_f1Weekends) {
            let upComingOrCurrentF1Weekend = this._getUpcomingOrCurrentWeekend();
            fun.call(this, upComingOrCurrentF1Weekend);
            return;
        }

        this.getF1Calendar(icalComp => {
            if (icalComp) {
                let subComponents = icalComp.getAllSubcomponents();

                let f1Events = subComponents.map(comp => F1EventFactory(comp));
                let f1EventsChunked = _chunkArray(f1Events);
                _f1Weekends = f1EventsChunked.map(f1EventChunk => new F1Weekend({
                    name: f1EventChunk[0].name,
                    sessions: f1EventChunk
                }));

                let upComingOrCurrentF1Weekend = this._getUpcomingOrCurrentWeekend();

                fun.call(this, upComingOrCurrentF1Weekend);
            } else {
                fun.call(this, null);
            }
        });
    },

    _getUpcomingOrCurrentWeekend() {
        let currentDateTime = moment();
        let latestUpcomingOrCurrentWeekend = null;

        for (let i = _f1Weekends.length - 1; i >= 0; i--) {
            let f1Weekend = _f1Weekends[i];

            if (currentDateTime.isSameOrBefore(f1Weekend.startDateTime())) {
                latestUpcomingOrCurrentWeekend = f1Weekend;
            } else if (currentDateTime.isBetween(f1Weekend.startDateTime(), f1Weekend.endDateTime())) {
                latestUpcomingOrCurrentWeekend = f1Weekend;
                break;
            } else if (currentDateTime.isSameOrAfter(f1Weekend.endDateTime())) {
                break;
            }
        }

        return latestUpcomingOrCurrentWeekend;
    }
});