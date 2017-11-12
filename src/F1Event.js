const isRequireJS = typeof require === 'function';

let ICAL, moment = null;
if (isRequireJS) {
    ICAL = require('./ical');
    moment = require('moment');
} else {
    // gjs environment.
    let Me = imports.misc.extensionUtils.getCurrentExtension();
    ICAL = Me.imports.ical.ICAL;
    moment = Me.imports.moment.moment;
}

class F1Event {
    constructor(name, session, startDateTime, endDateTime) {
        this.name = name;
        this.session = session;
        this.sessionShortName = this._sessionShortName(this.session);
        this.startDateTime = startDateTime;
        this.endDateTime = endDateTime;
    }

    delta() {
        return moment.duration(this.startDateTime.diff(moment()), 'ms');
    }

    finished() {
        let currentDateTime = moment();

        return this.endDateTime.isSameOrBefore(currentDateTime);
    }

    humanizedDelta() {
        let currentDateTime = moment();

        if (this.endDateTime.isBefore(currentDateTime)) {
            return `${this.delta().humanize()} ago`;
        } else {
            return this.delta().humanize();
        }
    }

    isCurrentSession() {
        let currentDateTime = moment();
        return currentDateTime.isBetween(this.startDateTime, this.endDateTime);
    }

    _sessionShortName(sessionName) {
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
}

function F1EventFactory(iCalComp) {
    let summary = iCalComp.getFirstPropertyValue('summary');
    let startDateTime = moment(iCalComp.getFirstPropertyValue('dtstart').toString());
    let endDateTime = moment(iCalComp.getFirstPropertyValue('dtend').toString());

    const summaryComponents = summary.split('-');
    const name = summaryComponents[0].trim()
        .replace(/.*Formula\s1\s*/i, '');  // Remove the prepended Formula 1.
    const session = summaryComponents[1].trim();

    return new F1Event(name, session, startDateTime, endDateTime);
}

// For the commonJS environment.
if (isRequireJS) {
    exports.F1Event = F1Event;
    exports.F1EventFactory = F1EventFactory;
}
