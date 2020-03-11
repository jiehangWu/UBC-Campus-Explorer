import Log from "../src/Util";
import Scheduler from "../src/scheduler/Scheduler";

describe("Scheduler", function () {
    let scheduler: Scheduler;

    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
    });


    beforeEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs before each test, which should make each test independent from the previous one
        Log.test(`BeforeTest: ${this.currentTest.title}`);
        scheduler = new Scheduler();
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // it("Example test", () => {
    //     let sections = [
    //         {
    //             courses_dept: "cpsc",
    //             courses_id: "340",
    //             courses_uuid: "1319",
    //             courses_pass: 101,
    //             courses_fail: 7,
    //             courses_audit: 2
    //         },
    //         {
    //             courses_dept: "cpsc",
    //             courses_id: "340",
    //             courses_uuid: "3397",
    //             courses_pass: 171,
    //             courses_fail: 3,
    //             courses_audit: 1
    //         },
    //         {
    //             courses_dept: "cpsc",
    //             courses_id: "344",
    //             courses_uuid: "62413",
    //             courses_pass: 93,
    //             courses_fail: 2,
    //             courses_audit: 0
    //         },
    //         {
    //             courses_dept: "cpsc",
    //             courses_id: "344",
    //             courses_uuid: "72385",
    //             courses_pass: 43,
    //             courses_fail: 1,
    //             courses_audit: 0
    //         }
    //     ];

    //     let rooms = [
    //         {
    //             rooms_shortname: "BUCH",
    //             rooms_number: "A101",
    //             rooms_seats: 275,
    //             rooms_lat: 49.26826,
    //             rooms_lon: -123.25468
    //         }
    //     ];

    //     let output = scheduler.schedule(sections, rooms);

    // });
});
