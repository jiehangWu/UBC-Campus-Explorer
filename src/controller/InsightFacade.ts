import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, ResultTooLargeError} from "./IInsightFacade";
import {InsightError, NotFoundError} from "./IInsightFacade";
import { rejects } from "assert";
import Query from "./Query/Query";
import { addCourseDataset } from "./addDatasetHelper";
import { promises } from "dns";
/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    public idList: string[];
    private datasets: InsightDataset[];
    // tslint:disable-next-line:object-literal-key-quotes

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

//  todo: 1 if dataset not added? 2 put in dataset 3 display field 4 order 5 asterisk

    public performQuery(query: any): Promise <any[]> {
        try {

            const q1 = new Query(query);
            q1.validate();
            // https://stackoverflow.com/questions/14832603/check-if-all-values-of-array-are-equal/14832797
            let queriedID: string = "";
            if (q1.IDstrings.every( (val, i, arr) => val === arr[0] )   ) {
                queriedID = q1.IDstrings[0];
            } else {
                throw new InsightError("Cannot query multiple datasets");
            }
            if (! this.idList.includes(queriedID)) {
                throw new InsightError("Referenced data not added");
            }
            const fs = require("fs");
            // https://stackoverflow.com/questions/10058814/get-data-from-fs-readfile
            let address = ("./data/courses/").concat(queriedID).concat(".json");
            let rawData = fs.readFileSync(address);
            let dataSet = JSON.parse(rawData);
            let res = q1.processQuery(dataSet);
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
