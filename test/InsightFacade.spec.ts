import { expect } from "chai";
import * as fs from "fs-extra";
import {
    InsightDatasetKind,
    InsightDataset,
    InsightError,
    NotFoundError,
} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any; // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string; // This is injected when reading the file
}

describe("InsightFacade Add/Remove Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        courses2: "./test/data/courses2.zip",
        empty: "./test/data/coursesEmpty.zip",
        invalidZip: "./test/data/coursesWithInvalidJson.zip",
        invalidTxt: "./test/data/courses.txt",
        validAndInvalidJson: "./test/data/coursesWithBothValidAndInvalid.zip",
        coursesInvalidFile: "./test/data/coursesContainsOnlyInvalidFile.zip",
        invalidName: "./test/data/invalidName.zip",
    };
    let datasets: { [id: string]: string } = {};
    let insightFacade: InsightFacade;
    const cacheDir = __dirname + "/../data";

    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs
                .readFileSync(datasetsToLoad[id])
                .toString("base64");
        }
    });

    beforeEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs before each test, which should make each test independent from the previous one
        Log.test(`BeforeTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // This is a unit test. You should create more like this!
    it.only("Should add a valid dataset", function () {
        const id: string = "courses";
        const expected: string[] = [id];

        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect(result).to.deep.equal(expected);
            })
            .catch((err: any) => {
                Log.error(err);
                expect.fail(err, expected, "Should not have rejected");
            });
    });

    it.only("Should throw InsightError when adding a dataset to a existing id", function () {
        const id: string = "courses";

        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then(() => {
                return insightFacade
                    .addDataset(id, datasets[id], InsightDatasetKind.Courses)
                    .then((result: string[]) => {
                        expect.fail(result, [], "Should not fulfill");
                    });
            })
            .catch((err: any) => {
                expect(err).to.be.a.instanceOf(InsightError);
            });
    });

    it("Should throw InsightError when adding a dataset that does not exist", function () {
        const id: string = "courses";

        return insightFacade
            .addDataset(id, datasets["notfound"], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, [], "Should not fulfill");
            })
            .catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });

    it("Should throw InsightError when adding a invalid id with underscore", function () {
        const id: string = "course_s";

        return insightFacade
            .addDataset(id, datasets["courses"], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, [], "Should not add dataset");
            })
            .catch((err: any) => {
                expect(err).to.be.a.instanceOf(InsightError);
            });
    });

    it("Should throw InsightError when adding a invalid id with whitespace", function () {
        const id: string = " ";

        return insightFacade
            .addDataset(id, datasets["courses"], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, [], "Should not add dataset");
            })
            .catch((err: any) => {
                expect(err).to.be.a.instanceOf(InsightError);
            });
    });

    it("Should throw InsightError when adding a NULL id", function () {
        const id: string = null;

        return insightFacade
            .addDataset(id, datasets["courses"], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, [], "Should not fulfill");
            })
            .catch((err: any) => {
                expect(err).to.be.a.instanceOf(InsightError);
            });
    });

    it("Should throw InsightError when adding to an undefined id", function () {
        const id: string = undefined;

        return insightFacade
            .addDataset(id, datasets["courses"], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, [], "Should not fulfill");
            })
            .catch((err: any) => {
                expect(err).to.be.a.instanceOf(InsightError);
            });
    });

    it("Should throw InsightError when adding a dataset that is not a ZIP file", function () {
        const id: string = "invalid";

        return insightFacade
            .addDataset(id, datasets["invalidTxt"], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, [], "Should not add dataset");
            })
            .catch((err: any) => {
                expect(err).to.be.a.instanceOf(InsightError);
            });
    });

    it("Should throw InsightError when adding a dataset that does not contain a valid json file", function () {
        const id: string = "invalid";

        return insightFacade
            .addDataset(id, datasets["invalidZip"], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, [], "Should not add dataset");
            })
            .catch((err: any) => {
                Log.error(err);
                expect(err).to.be.a.instanceOf(InsightError);
            });
    });

    it("Should throw InsightError when adding a dataset that does not contain any file", function () {
        const id: string = "empty";

        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, [], "Should not add dataset");
            })
            .catch((err: any) => {
                expect(err).to.be.a.instanceOf(InsightError);
            });
    });

    it("Should be able to add dataset given a file that contains both valid and invalid file", function () {
        const id: string = "courses";
        const expected: string[] = [id];

        return insightFacade
            .addDataset(
                id,
                datasets["validAndInvalidJson"],
                InsightDatasetKind.Courses,
            )
            .then((result: string[]) => {
                expect(result).to.deep.equal(expected);
            })
            .catch((err: any) => {
                expect.fail(err, expected, "Should not be rejected");
            });
    });

    it("Should throw InsightError given a zip file that does not contain courses in its name", function () {
        const id: string = "invalidName";

        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, [], "Should not fulfill");
            })
            .catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });

    it("Should throw InsightError given a zip file that contains only invalid file", function () {
        const id: string = "courses";

        return insightFacade
            .addDataset(
                id,
                datasets["coursesInvalidFile"],
                InsightDatasetKind.Courses,
            )
            .then((result: string[]) => {
                expect.fail(result, [], "Should not fulfill");
            })
            .catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });

    // it("Should be able to add multiple datasets", function () {
    //     const id1: string = "courses";
    //     const id2: string = "courses2";
    //     const expected: string[] = [id1, id2];

    //     return insightFacade
    //         .addDataset(id1, datasets[id1], InsightDatasetKind.Courses)
    //         .then((res: string[]) => {
    //             expect(res).to.deep.equal([id1]);
    //         })
    //         .then(() => {
    //             return insightFacade
    //                 .addDataset(id2, datasets[id2], InsightDatasetKind.Courses)
    //                 .then((res: string[]) => {
    //                     expect(res).to.deep.equal(expected);
    //                 })
    //                 .catch((err: any) => {
    //                     expect.fail(err, expected, "Should not be rejected");
    //                 });
    //         })
    //         .catch((err: any) => {
    //             expect.fail(err, [id1], "Should not be rejected");
    //         });
    // });

    // Remove tests start from here
    // --------------------------------------------------------------------------------
    it("Should be able to remove a existing dataset given a valid id", function () {
        const id: string = "courses";

        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then(() => {
                return insightFacade
                    .removeDataset(id)
                    .then((result: string) => {
                        expect(result).to.deep.equal(id);
                    })
                    .catch((err: any) => {
                        expect.fail(err, id, "Should not be rejected");
                    });
            })
            .catch((err: any) => {
                expect.fail(err, [id], "Should not be rejected");
            });
    });

    it("Should throw InsightError given an invalid id with underscore when removing a dataset", function () {
        const id: string = "cour_ses";

        return insightFacade
            .removeDataset(id)
            .then((result: string) => {
                expect.fail(result, id, "Should not fulfill");
            })
            .catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
            });
    });

    it("Should throw InsightError given an invalid id with only whitespace when removing a dataset", function () {
        const id: string = " ";

        return insightFacade
            .removeDataset(id)
            .then((result: string) => {
                expect.fail(result, id, "Should not fulfill");
            })
            .catch((err: any) => {
                expect(err).to.be.a.instanceOf(InsightError);
            });
    });

    it("Should throw InsightError given a NULL id when removing a dataset", function () {
        const id: string = null;

        return insightFacade
            .removeDataset(id)
            .then((result: string) => {
                expect.fail(result, "", "Should not fulfill");
            })
            .catch((err: any) => {
                expect(err).to.be.a.instanceOf(InsightError);
            });
    });

    it("Should throw InsightError given an undefined id when removing a dataset", function () {
        const id: string = undefined;

        return insightFacade
            .removeDataset(id)
            .then((result: string) => {
                expect.fail(result, "", "Should not fulfill");
            })
            .catch((err: any) => {
                expect(err).to.be.a.instanceOf(InsightError);
            });
    });

    it("Should throw NotFoundError when removing a dataset that is not added given a valid id", function () {
        const id: string = "courses";

        return insightFacade
            .removeDataset(id)
            .then((result: string) => {
                expect.fail(result, "", "Should not fulfill");
            })
            .catch((err: any) => {
                expect(err).to.be.a.instanceOf(NotFoundError);
            });
    });

    // it("Should be able to remove multiple valid datasets", function () {
    //     const id1: string = "courses";
    //     const id2: string = "courses2";

    //     insightFacade.addDataset(
    //         id1,
    //         datasets[id1],
    //         InsightDatasetKind.Courses,
    //     );
    //     insightFacade.addDataset(
    //         id2,
    //         datasets[id2],
    //         InsightDatasetKind.Courses,
    //     );

    //     return insightFacade
    //         .removeDataset(id1)
    //         .then((result: string) => {
    //             expect(result).to.deep.equal(id1);
    //         })
    //         .then(() => {
    //             return insightFacade
    //                 .removeDataset(id2)
    //                 .then((result: string) => {
    //                     expect(result).to.deep.equal(id2);
    //                 })
    //                 .catch((err: any) => {
    //                     expect.fail(err, id2, "Should not be rejected");
    //                 });
    //         })
    //         .catch((err: any) => {
    //             expect.fail(err, id1, "Should not be rejected");
    //         });
    // });

    it("Should list an empty array when no dataset is added", function () {
        return insightFacade
            .listDatasets()
            .then((result: InsightDataset[]) => {
                expect(result).to.have.lengthOf(0);
                expect(result).to.include.members([]);
            })
            .catch((err: any) => {
                Log.error(err);
                expect.fail(err, [], "Should not be rejected");
            });
    });

    it("Should list all currently added datasets, their types, and number of rows", function () {
        const id: string = "courses";
        const expected: InsightDataset[] = [
            {
                id: "courses",
                kind: InsightDatasetKind.Courses,
                numRows: 64612,
            },
        ];

        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then(() => {
                return insightFacade
                    .listDatasets()
                    .then((res: InsightDataset[]) => {
                        expect(res).to.deep.equal(expected);
                    })
                    .catch((err: any) => {
                        expect.fail(err, expected, "Should not be rejected");
                    });
            })
            .catch((err: any) => {
                expect.fail(err, [id], "Should not be rejected");
            });
    });

});

/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: {
        [id: string]: { path: string; kind: InsightDatasetKind };
    } = {
        courses: {
            path: "./test/data/courses.zip",
            kind: InsightDatasetKind.Courses,
        },
    };
    let insightFacade: InsightFacade;
    let testQueries: ITestQuery[] = [];

    // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
    before(function () {
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = TestUtil.readTestQueries();
        } catch (err) {
            expect.fail(
                "",
                "",
                `Failed to read one or more test queries. ${err}`,
            );
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Will fail* if there is a problem reading ANY dataset.
        const loadDatasetPromises: Array<Promise<string[]>> = [];
        insightFacade = new InsightFacade();
        for (const id of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[id];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(
                insightFacade.addDataset(id, data, ds.kind),
            );
        }
        return Promise.all(loadDatasetPromises);
        // .catch((err) => {
        //     /* *IMPORTANT NOTE: This catch is to let this run even without the implemented addDataset,
        //      * for the purposes of seeing all your tests run.
        //      * TODO For C1, remove this catch block (but keep the Promise.all)
        //      */
        //     return Promise.resolve("HACK TO LET QUERIES RUN");
        // });
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // Dynamically create and run a test for each query in testQueries
    // Creates an extra "test" called "Should run test queries" as a byproduct. Don't worry about it
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function (done) {
                    insightFacade
                        .performQuery(test.query)
                        .then((result) => {
                            TestUtil.checkQueryResult(test, result, done);
                        })
                        .catch((err) => {
                            TestUtil.checkQueryResult(test, err, done);
                        });
                });
            }
        });
    });
});
