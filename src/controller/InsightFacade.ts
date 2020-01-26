import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, ResultTooLargeError} from "./IInsightFacade";
import {InsightError, NotFoundError} from "./IInsightFacade";
import { rejects } from "assert";
import Query from "./Query/Query";
import { addCourseDataset } from "./addDatasetHelper";
/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    public idList: string[];
    private datasets: InsightDataset[];
    // tslint:disable-next-line:object-literal-key-quotes
    private testdataset: any[] = [{"dept": "adhe", "id": "504", "avg": 96.12,
    // tslint:disable-next-line:object-literal-key-quotes
    "instructor": "", "title": "rsrch methdlgy", "pass": 9, "fail": 0, "audit": 9, "uuid": 31379, "year": "2015"},
    // tslint:disable-next-line:object-literal-key-quotes
    { "dept": "aanb", "id": "504", "avg": 94.44, "instructor": "", "title": "rsrch methdlgy",
    // tslint:disable-next-line:object-literal-key-quotes
    "pass": 9, "fail": 0, "audit": 9, "uuid": 31380, "year": "2015"}];

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.idList = [];
        this.datasets = [];
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        if (this.validateId(id)) {
            // check if id has already been added
            if (this.idList.includes(id)) {
                return Promise.reject(new InsightError("Database already contains the same id"));
            }

            if (kind === InsightDatasetKind.Courses) {
                return addCourseDataset(id, content, kind)
                    .then((result: any) => {
                        this.idList.push(result[0]);
                        this.datasets.push({
                            id: result[0],
                            kind: InsightDatasetKind.Courses,
                            numRows: result[1],
                        });
                        return Promise.resolve(this.idList);
                    })
                    .catch((err: any) => {
                        return Promise.reject(err);
                    });
            } else {
                return Promise.reject(new InsightError("Invalid InsightDatasetKind"));
            }

        } else {
            return Promise.reject(new InsightError("This id is invalid"));
        }
    }

    public removeDataset(id: string): Promise<string> {
        if (!this.validateId(id)) {
            return Promise.reject(new InsightError("This id is invalid"));
        }

        let path = "./data/" + id;
        let fs = require("fs-extra");

        if (this.idList.includes(id)) {
            try {
                fs.unlinkSync(path + "/" + id + ".json");
                fs.removeSync(path);
            } catch (err) {
                return Promise.reject(new InsightError("Could not unlink dataset"));
            }

            this.idList = this.idList.filter((val: string) => {
                if (val !== id) {
                    return val;
                }
            });

            this.datasets = this.datasets.filter((dataset: InsightDataset) => {
                if (dataset.id !== id) {
                    return dataset;
                }
            });

            return Promise.resolve(id);
        } else {
            return Promise.reject(new NotFoundError("ID is not in the dataset"));
        }
    }
// previous version
//     public performQuery(query: any): Promise <any[]> {
//         try {
//         const q1 = new Query(query, this.datasets);
//         q1.validate(query);
//         // let res: any[] = []; // just for testing
//         let res = q1.processQuery();
//         return Promise.resolve(res);
//         }   catch (err) {
//             if (err instanceof ResultTooLargeError) {
//                 return Promise.reject(new ResultTooLargeError(err));
//             } else if (err instanceof InsightError) {
//                 return Promise.reject(new InsightError(err));
//       } else { return Promise.reject(err); }
//     }
// }

    public performQuery(query: any): Promise <any[]> {
        try {
            // const fs = require("fs");
            // let content: any[] = [];
            // // https://stackoverflow.com/questions/10058814/get-data-from-fs-readfile
            // fs.readFile("./data/courses/courses.json", function read(err: any, data: any) {
            //     if (err) {
            //         throw err;
            //     }
            //     content = data; });
            const q1 = new Query(query, this.testdataset);
            q1.validate(query);
            let res = q1.processQuery();
            return Promise.resolve(res);
        }   catch (err) {
            if (err instanceof ResultTooLargeError) {
                return Promise.reject(new ResultTooLargeError(err));
            } else if (err instanceof InsightError) {
                return Promise.reject(new InsightError(err));
    } else { return Promise.reject(err); }
    }
    }
    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.resolve(this.datasets);
    }

    private validateId(id: string): boolean {
        // check if id is null or undefined
        if (typeof id === "undefined" || id === null) {
            return false;
        }
        // "_" should not be included in id
        if (id.includes("_")) {
            return false;
        }
        // check if a string contains only whitespaces
        for (let i = 0; i < id.length; i++) {
            if (id.charAt(i) !== " ") {
                return true;
            }
        }

        return false;
    }
}
