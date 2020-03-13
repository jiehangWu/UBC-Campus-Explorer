import Log from "../src/Util";
import Scheduler from "../src/scheduler/Scheduler";
import { expect } from "chai";
import * as fs from "fs-extra";
import InsightFacade from "../src/controller/InsightFacade";
import { InsightDatasetKind } from "../src/controller/IInsightFacade";

describe("Scheduler", function () {
    let scheduler: Scheduler;
    let insightFacade: InsightFacade;

    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
        let course: string = fs.readFileSync("../data/courses/courses.json").toString("base64");
        insightFacade = new InsightFacade();
        insightFacade.addDataset("courses", course, InsightDatasetKind.Courses);
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
    //             "courses_dept": "cpsc",
    //             "courses_id": "340",
    //             "courses_uuid": "1319",
    //             "courses_pass": 101,
    //             "courses_fail": 7,
    //             "courses_audit": 2
    //         },
    //         {
    //             "courses_dept": "cpsc",
    //             "courses_id": "340",
    //             "courses_uuid": "3397",
    //             "courses_pass": 171,
    //             "courses_fail": 3,
    //             "courses_audit": 1
    //         },
    //         {
    //             "courses_dept": "cpsc",
    //             "courses_id": "344",
    //             "courses_uuid": "62413",
    //             "courses_pass": 93,
    //             "courses_fail": 2,
    //             "courses_audit": 0
    //         },
    //         {
    //             "courses_dept": "cpsc",
    //             "courses_id": "344",
    //             "courses_uuid": "72385",
    //             "courses_pass": 43,
    //             "courses_fail": 1,
    //             "courses_audit": 0
    //         }
    //     ];

    //     let rooms = [
    //         {
    //             "rooms_shortname": "AERL",
    //             "rooms_number": "120",
    //             "rooms_seats": 144,
    //             "rooms_lat": 49.26372,
    //             "rooms_lon": -123.25099
    //         },
    //         {
    //             "rooms_shortname": "ALRD",
    //             "rooms_number": "105",
    //             "rooms_seats": 94,
    //             "rooms_lat": 49.2699,
    //             "rooms_lon": -123.25318
    //         },
    //         {
    //             "rooms_shortname": "ANGU",
    //             "rooms_number": "098",
    //             "rooms_seats": 260,
    //             "rooms_lat": 49.26486,
    //             "rooms_lon": -123.25364
    //         },
    //         {
    //             "rooms_shortname": "BUCH",
    //             "rooms_number": "A101",
    //             "rooms_seats": 275,
    //             "rooms_lat": 49.26826,
    //             "rooms_lon": -123.25468
    //         }
    //     ];

    //     let output = scheduler.schedule(sections, rooms);
    //     console.log(output);
    //     const expected = [ [ { rooms_shortname: 'AERL',
    //         rooms_number: '120',
    //         rooms_seats: 144,
    //         rooms_lat: 49.26372,
    //         rooms_lon: -123.25099 },
    //         { courses_dept: 'cpsc',
    //             courses_id: '340',
    //             courses_uuid: '1319',
    //             courses_pass: 101,
    //             courses_fail: 7,
    //             courses_audit: 2 },
    //         'MWF 0800-0900' ],
    //         [ { rooms_shortname: 'ANGU',
    //             rooms_number: '098',
    //             rooms_seats: 260,
    //             rooms_lat: 49.26486,
    //             rooms_lon: -123.25364 },
    //             { courses_dept: 'cpsc',
    //                 courses_id: '340',
    //                 courses_uuid: '3397',
    //                 courses_pass: 171,
    //                 courses_fail: 3,
    //                 courses_audit: 1 },
    //             'MWF 0900-1000' ],
    //         [ { rooms_shortname: 'BUCH',
    //             rooms_number: 'A101',
    //             rooms_seats: 275,
    //             rooms_lat: 49.26826,
    //             rooms_lon: -123.25468 },
    //             { courses_dept: 'cpsc',
    //                 courses_id: '344',
    //                 courses_uuid: '62413',
    //                 courses_pass: 93,
    //                 courses_fail: 2,
    //                 courses_audit: 0 },
    //             'MWF 0800-0900' ],
    //         [ { rooms_shortname: 'ALRD',
    //             rooms_number: '105',
    //             rooms_seats: 94,
    //             rooms_lat: 49.2699,
    //             rooms_lon: -123.25318 },
    //             { courses_dept: 'cpsc',
    //                 courses_id: '344',
    //                 courses_uuid: '72385',
    //                 courses_pass: 43,
    //                 courses_fail: 1,
    //                 courses_audit: 0 },
    //             'MWF 0900-1000' ] ];
    //     expect(output).to.deep.equal(expected);
    // });

    // it("Test 2", () => {
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
    //             courses_id: "340",
    //             courses_uuid: "250",
    //             courses_pass: 171,
    //             courses_fail: 3,
    //             courses_audit: 1
    //         },
    //         {
    //             courses_dept: "cpsc",
    //             courses_id: "340",
    //             courses_uuid: "123",
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
    //             "rooms_shortname": "AERL",
    //             "rooms_number": "120",
    //             "rooms_seats": 1,
    //             "rooms_lat": 49.26372,
    //             "rooms_lon": -123.25099,
    //             "rooms_fullname": "Aquatic Ecosystems Research Lab"
    //         },
    //         {
    //             "rooms_shortname": "AERL",
    //             "rooms_number": "120",
    //             "rooms_seats": 2,
    //             "rooms_lat": 49.26372,
    //             "rooms_lon": -123.25099,
    //         },
    //         {
    //             "rooms_shortname": "ALRD",
    //             "rooms_number": "104",
    //             "rooms_seats": 3,
    //             "rooms_lat": 49.2699,
    //             "rooms_lon": -123.2531,
    //         },
    //         {
    //             "rooms_shortname": "ALRD",
    //             "rooms_number": "105",
    //             "rooms_seats": 4,
    //             "rooms_lat": 49.2699,
    //             "rooms_lon": -123.2531,
    //         },
    //         {
    //             "rooms_shortname": "ALRD",
    //             "rooms_number": "106",
    //             "rooms_seats": 5,
    //             "rooms_lat": 49.2699,
    //             "rooms_lon": -123.2531,
    //         },
    //         {
    //             "rooms_shortname": "ANGU",
    //             "rooms_number": "098",
    //             "rooms_seats": 6,
    //             "rooms_lat": 49.26486,
    //             "rooms_lon": -123.25364,
    //             "rooms_fullname": "Sauder"
    //         },
    //         {
    //             "rooms_shortname": "ANGU",
    //             "rooms_number": "098",
    //             "rooms_seats": 12,
    //             "rooms_lat": 49.26486,
    //             "rooms_lon": -123.25364,
    //         },
    //         {
    //             "rooms_shortname": "BUCH",
    //             "rooms_number": "A101",
    //             "rooms_seats": 10,
    //             "rooms_lat": 49.26826,
    //             "rooms_lon": -123.25468
    //         }
    //     ];

    //     let output = scheduler.schedule(sections, rooms);
    //     console.log(output);
    //     expect(output).to.deep.equal([]);
    // });
});
