import Log from "../Util";
import { IInsightFacade, InsightDataset, InsightDatasetKind } from "./IInsightFacade";
import { InsightError, NotFoundError } from "./IInsightFacade";
import { DatasetController } from "./DatasetController";
/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */

export default class InsightFacade implements IInsightFacade {
    public datasetController: DatasetController;

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

            if (kind === InsightDatasetKind.Courses) {
                return this.datasetController.addCourseDataset(id, content, kind)
                    .then((result: any) => {
                        this.datasetController.datasets.set(result[0],
                            {   id: id,
                                kind: kind,
                                numRows: result[1]
                            });
                        return Promise.resolve(Array.from(this.datasetController.datasets.keys()));
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
        return this.datasetController.removeDataset(id);
    }

    public performQuery(query: any): Promise<any[]> {
        return Promise.reject("Not implemented.");
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.resolve(Array.from(this.datasetController.datasets.values()));
    }

}
