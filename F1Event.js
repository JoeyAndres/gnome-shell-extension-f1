'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var isRequireJS = typeof require === 'function';

var ICAL = void 0,
    moment = null;
if (isRequireJS) {
    ICAL = require('./ical');
    moment = require('moment');
} else {
    // gjs environment.
    var Me = imports.misc.extensionUtils.getCurrentExtension();
    ICAL = Me.imports.ical.ICAL;
    moment = Me.imports.moment.moment;
}

var F1Event = function () {
    function F1Event(name, session, startDateTime, endDateTime) {
        _classCallCheck(this, F1Event);

        this.name = name;
        this.session = session;
        this.sessionShortName = this._sessionShortName(this.session);
        this.startDateTime = startDateTime;
        this.endDateTime = endDateTime;
    }

    _createClass(F1Event, [{
        key: 'delta',
        value: function delta() {
            return moment.duration(this.startDateTime.diff(moment()), 'ms');
        }
    }, {
        key: 'finished',
        value: function finished() {
            var currentDateTime = moment();

            return this.endDateTime.isSameOrBefore(currentDateTime);
        }
    }, {
        key: 'humanizedDelta',
        value: function humanizedDelta() {
            var currentDateTime = moment();

            if (this.endDateTime.isBefore(currentDateTime)) {
                return this.delta().humanize() + ' ago';
            } else {
                return this.delta().humanize();
            }
        }
    }, {
        key: 'isCurrentSession',
        value: function isCurrentSession() {
            var currentDateTime = moment();
            return currentDateTime.isBetween(this.startDateTime, this.endDateTime);
        }
    }, {
        key: '_sessionShortName',
        value: function _sessionShortName(sessionName) {
            if (/first\s+practice/ig.test(sessionName)) {
                return 'FP1';
            } else if (/second\s+practice/ig.test(sessionName)) {
                return 'FP2';
            } else if (/third\s+practice/ig.test(sessionName)) {
                return 'FP3';
            } else if (/qualifying/ig.test(sessionName)) {
                return 'Qualifying';
            } else if (/grand\s+prix/ig.test(sessionName)) {
                return 'Race';
            } else {
                // If there is an abberation, have something ambiguous.
                return 'Grand Prix';
            }
        }
    }]);

    return F1Event;
}();

function F1EventFactory(iCalComp) {
    var summary = iCalComp.getFirstPropertyValue('summary');
    var startDateTime = moment(iCalComp.getFirstPropertyValue('dtstart').toString());
    var endDateTime = moment(iCalComp.getFirstPropertyValue('dtend').toString());

    var summaryComponents = summary.split('-');
    var name = summaryComponents[0].trim().replace(/.*Formula\s1\s*/i, ''); // Remove the prepended Formula 1.
    var session = summaryComponents[1].trim();

    return new F1Event(name, session, startDateTime, endDateTime);
}

// For the commonJS environment.
if (isRequireJS) {
    exports.F1Event = F1Event;
    exports.F1EventFactory = F1EventFactory;
}