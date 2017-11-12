let fs = require('fs');

let moment = require('moment');
let ICAL = require('../src/ical');

let F1Event  = require('../src/F1Event').F1Event;
let F1EventFactory = require('../src/F1Event').F1EventFactory;

describe('F1Event test suite', function() {
    let testCalendarEvents = [];

    beforeEach(function() {
        const testCalendarStr = fs.readFileSync('./spec/data/ical.ics', 'utf-8');
        const testCalendarData = ICAL.parse(testCalendarStr);
        const testCalendar = new ICAL.Component(testCalendarData);
        testCalendarEvents = testCalendar.getAllSubcomponents();
    });

    it ('initializes session without exceptions', function() {
        let F1EventFactoryCalls = () => {
            testCalendarEvents.forEach(c => {
                let f1Event = new F1EventFactory(c);
            });
        };

        expect(F1EventFactoryCalls).not.toThrow();
    });

    it ('extracts the correct sessionShortName', function() {
        let F1EventFactoryCalls = () => {
            testCalendarEvents.forEach(c => {
                let f1Event = new F1EventFactory(c);

                // We shouldn't reach the fault-tolerance mode.
                expect(f1Event.sessionShortName).not.toBe('Grand Prix');
            });
        };

        F1EventFactoryCalls();
    });

    // https://stackoverflow.com/a/42787232
    describe('finished() method', function() {
        let timerCallback = null;
        let f1Events = [];

        beforeEach(function() {
            timerCallback = jasmine.createSpy("timerCallback");
            jasmine.clock().install();

            f1Events = testCalendarEvents.map(c => new F1EventFactory(c));
        });

        afterEach(function() {
            jasmine.clock().uninstall();
        });

        it('returns false if before endDate of a session. Otherwise, returns true.', function() {
            for (var d = new Date(2017, 0, 1); d <= new Date(2017, 11, 31); d.setDate(d.getDate() + 1)) {
                jasmine.clock().mockDate(d);  // Mock current time.

                f1Events.forEach(session => {
                    if (session.endDateTime.isSameOrBefore(moment())) {
                        expect(session.finished()).toBe(true);
                    } else {
                        expect(session.finished()).toBe(false);
                    }
                });
            }
        });
    });

    describe('isCurrentSession method', function() {
        // TODO: Capture the dates within the start/end date and pick random dates within, ensuring it returns true.
    });
});