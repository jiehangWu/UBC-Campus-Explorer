import Log from "../Util";
import { IInsightFacade,
    InsightDataset,
    InsightDatasetKind } from "./IInsightFacade";
import { InsightError } from "./IInsightFacade";
import { DatasetController } from "./DatasetController";
import Query from "./Query/Query";
import * as fs from "fs-extra";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */

export default class InsightFacade implements IInsightFacade {
    private datasetController: DatasetController;

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.datasetController = new DatasetController();
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        if (this.datasetController.validateId(id)) {
            // check if id has already been added
            if (this.datasetController.datasets.has(id)) {
                return Promise.reject(new InsightError("Database already contains the same id"));
            }

            return this.datasetController.addDataset(id, content, kind)
                .then(() => {
                    return Promise.resolve(Array.from(this.datasetController.datasets.keys()));
                })
                .catch((err: any) => {
                    Log.error(err);
                    return Promise.reject(new InsightError("Can not add dataset"));
                });


        } else {
            return Promise.reject(new InsightError("This id is invalid"));
        }
    }

    public removeDataset(id: string): Promise<string> {
       return this.datasetController.removeDataset(id);
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.resolve(Array.from(this.datasetController.datasets.values()));
    }

    public performQuery(query: any): Promise<any[]> {
        try {
            const queryResult = new Query(query);
            queryResult.validate();

            // check if all elements in array is the same.
            // https://stackoverflow.com/questions/14832603/check-if-all-values-of-array-are-equal/14832797
            let queriedID: string;
            if (queryResult.IDstrings.every((val, _, arr) => val === arr[0])) {
                queriedID = queryResult.IDstrings[0];
            } else {
                return Promise.reject(new InsightError("Cannot query multiple datasets"));
            }

            if (!this.datasetController.datasets.has(queriedID)) {
                return Promise.reject(new InsightError("Referenced data not added"));
            }

            // https://stackoverflow.com/questions/10058814/get-data-from-fs-readfile.
            let path = "./data/" + queriedID + "/" + queriedID + ".json";
            let rawData: any = fs.readFileSync(path);
            let dataset = JSON.parse(rawData);
            let res = queryResult.processQuery(dataset);

            return Promise.resolve(res);
        } catch (err) {
            return Promise.reject(err);
        }
    }

}
