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

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.idList = [];
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        if (this.validateId(id)) {
            // check if id has already been added
            if (this.idList.includes(id)) {
                return Promise.reject(new InsightError("Database already contains the same id"));
            }

            if (kind === InsightDatasetKind.Courses) {
                return addCourseDataset(id, content, kind)
                    .then((returnedId: any) => {
                        this.idList.push(returnedId);
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
        return Promise.reject("Not implemented.");
    }

    public performQuery(query: any): Promise<any[]> {
        return Promise.reject("Not implemented.");
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.reject("Not implemented.");
    }

    private validateId(id: string): boolean {
        // "_" should not be included in id
        if (id.includes("_")) {
            return false;
        }

        if (typeof (id) === undefined) {
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
