import Log from "../Util";
import { IInsightFacade, InsightDataset, InsightDatasetKind } from "./IInsightFacade";
import { InsightError, NotFoundError } from "./IInsightFacade";
import { addCourseDataset } from "./addDatasetHelper";
/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */

export default class InsightFacade implements IInsightFacade {
    public idList: string[];
    public datasets: InsightDataset[];

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

    public performQuery(query: any): Promise<any[]> {
        return Promise.reject("Not implemented.");
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
