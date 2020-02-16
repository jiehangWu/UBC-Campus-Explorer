import { InsightError } from "../IInsightFacade";

export class MKey {
    public key: string;
    public idString: string;
    public field: string;
    public value: any;

    private mfieldsC: string[] = ["avg" , "pass" , "fail" , "audit" , "year"];
    private mfieldsR: string[] = ["lat", "lon", "seats" ];

    public constructor(pair: any) {
        this.key = Object.keys(pair)[0];
        this.splitPair(this.key);
        this.value = Object.values(pair)[0];
    }

    public validate() {
        this.validateMField();
    }

    public splitPair(pair: string) {
        const str = pair.split("_", 2);
        this.idString = str[0];
        this.field = str[1];
    }

    public validateMField() {
        if (typeof this.value !== "number") {
            throw new InsightError("wrong type in Mfield"); }

        if (this.idString === "courses") {
            if (!this.mfieldsC.includes(this.field)) {
                throw new InsightError("Invalid key courses_xxx in COLUMNS");
            }
        } else if (this.idString === "rooms") {
            if (!this.mfieldsR.includes(this.field)) {
                throw new InsightError("Invalid key rooms_xxx in COLUMNS");
            }
        }
    }

    public parseMComparator (dataPoint: any) {
        return dataPoint[this.key] === this.value;
    }

    public getIDstring(): string {
        return this.idString;
    }
}
