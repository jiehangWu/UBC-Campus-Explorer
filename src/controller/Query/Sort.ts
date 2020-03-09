import { InsightError } from "../IInsightFacade";

export class Sort {
    public dir: string;
    public keys: string[];

    public constructor(sortObj: any) {
        if (! Object.keys(sortObj).includes("dir") ) {
            throw new InsightError("missing dir");
        }
        if (! Object.keys(sortObj).includes("keys") ) {
            throw new InsightError("missing keys");
        }
        if ( Object.keys(sortObj).length !== 2 ) {
            throw new InsightError("excess key in sort");
        }
        Object.keys(sortObj).forEach((key) => {
            if (! (key === "dir" || key === "keys")) {
                throw new InsightError("Wrong key in ORDERS");
            }
        });

        this.dir = sortObj["dir"];
        this.keys = sortObj["keys"];
    }

    public validate () {
            this.validateDir();
            this.validateKeys();
    }

    private validateKeys() {
        if (! Array.isArray(this.keys)) {
            throw new InsightError("keys must be an array");
        }

        if (this.keys.length === 0) {
            throw new InsightError("keys must not be an unempty array");
        }
        // no need to check id & fields in sort, since they match up columns
    }

    private validateDir() {
        if (!["DOWN", "UP"].includes(this.dir) ) {
            throw new InsightError("Wrong direction key");
        }
    }
}
