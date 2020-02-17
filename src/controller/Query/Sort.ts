import { InsightError } from "../IInsightFacade";

export class Sort {
    public dir: string;
    public keys: string[];

    // public keysInSort: string[];

    public IDstrings: string[];

    public constructor(sortObj: any) {
        // this.keysInSort = [];

        if (! Object.keys(sortObj).includes("dir") ) {
            throw new InsightError("missing dir");
        }
        if (! Object.keys(sortObj).includes("keys") ) {
            throw new InsightError("missing keys");
        }
        if ( Object.keys(sortObj).length !== 2 ) {
            throw new InsightError("excess key in sort");
        }
        //  2 if blocks below to check if wrong key in options
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
            throw new InsightError("keys must not be an empty array");
        }

        // no need to check if id of keys in sort are the same, cos columns already should have cover those
        // this.keys.forEach((key) => {
        //     if (applykey)
        //     let idstring = key.split("_", 2)[0];
        //     this.IDstrings.push(idstring);
        // });
        //  so if there is transformation, this would be under if transformation block

        // transformation or not: as a boolean or two methods?
        // have check if keys is applykey? if yes ???
    }

    private validateDir() {
        if (!["DOWN", "UP"].includes(this.dir) ) {
            throw new InsightError("Wrong direction key");
        }
    }

}
