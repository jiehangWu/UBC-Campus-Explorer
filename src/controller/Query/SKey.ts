import { InsightError } from "../IInsightFacade";

export class SKey {
    public key: string;
    public idString: string;
    public field: string;
    public value: string;
    public dataset: string[] = ["courses"];
    public sfields: string[] =  ["dept" , "id" , "instructor" , "title" , "uuid"];

    public constructor(pair: any) {
        this.key = Object.keys(pair)[0];
        this.splitPair(this.key);
        this.value = Object.values(pair)[0] as string;
    }

    public validate() {
        this.validateSField();
        this.validateIDString();
        if (this.value.includes("*")) { this.validateAsterisk(); }
    }

    public splitPair(pair: string) {
        const str = pair.split("_", 2);
        this.idString = str[0];
        this.field = str[1];
    }

    public validateIDString() {
        if (! this.dataset.includes(this.idString)) {
            throw new InsightError("Referenced dataset coures not added yet");
        }
    }
    public validateSField() {
        if (! this.sfields.includes(this.field)) {
            throw new InsightError("Invalid key courses_xxx in COLUMNS"); }
        if (typeof this.value !== "string") {
            throw new InsightError("wrong type in Sfield"); }
        }

        public getIDstring(): string {
            return this.idString;
        }

    public validateAsterisk() {
        let flag: boolean = false;
        if (this.value.includes("*")) {
            let count: number = this.value.replace(/[^*]/g , "").length;
            if (count === 2) {
                flag = this.value.startsWith("*") && this.value.endsWith("*");
            } else if (count === 1) {
                flag = this.value.startsWith("*") || this.value.endsWith("*");
            }
        }
        if (flag === false) {
            throw new InsightError("Wrong * placement");
        }
    }

    public checkSfield(datapoint: any): boolean {
        let dataValue: string = datapoint[this.field];
        let count: number = this.value.replace(/[^*]/g , "").length;

        if (this.value.includes("*")) {
        if (count === 2) {
            return dataValue.includes(this.value.substr(1, (this.value.length - 2)));
        } else if (count === 1) {
            if (this.value.startsWith("*")) {
                return dataValue.endsWith(this.value.substr(1, this.value.length - 1));

            } else if (this.value.endsWith("*")) {
                return dataValue.startsWith(this.value.substr(0, (this.value.length - 2)));
            }
        }
    } else {
    // https://stackoverflow.com/questions/2167602/optimum-way-to-compare-strings-in-javascript
        return ((this.value).localeCompare(datapoint[this.field]) === 0);
        }
    }
}
