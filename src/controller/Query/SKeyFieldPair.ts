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
        // this.updateSkey();
        this.validateSField();
        this.validateIDString();
    }

    // public updateSkey() {
    //     this.key = Object.keys(this)[0];
    //     this.splitPair(this.key);
    //     this.value = Object.values(this)[0];
    // }

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
}
