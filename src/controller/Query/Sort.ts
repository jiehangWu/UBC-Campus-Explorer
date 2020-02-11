import { InsightError } from "../IInsightFacade";

export class Sort {
    public dir: string;
    public keys: string[];

    public fields: string[];


    public constructor(sortObj: any) {
        this.fields = [];

        //  2 if blocks below to check if wrong key in options
        Object.keys(sortObj).forEach((key) => {
            if (! (key === "dir" || key === "keys")) {
                throw new InsightError("Wrong key in options");
            }
        });

        if ( Object.keys(sortObj).length !== 2 )        { throw new InsightError("excess key in sort"); }
        if (! Object.keys(sortObj).includes("dir") )    { throw new InsightError("missing dir"); }
        if (! Object.keys(sortObj).includes("keys") )   { throw new InsightError("missing keys"); }

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

        this.keys.forEach((key) => {
            this.fields.push(key);
        });
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
