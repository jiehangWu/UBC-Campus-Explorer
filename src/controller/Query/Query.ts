import {FILTER} from "./Filter";
// import { KEYFIELDPAIR, MKey, SKey } from "./KEYFIELDPAIR";
import {OPTIONS} from "./Options";
import {InsightError, InsightDataset} from "../IInsightFacade";


export default class Query {
    public WHERE: FILTER;
    public OPTIONS: OPTIONS;
    public keyset: string[];
    public LogicComparators: string[] = ["AND", "OR"];
    public MComparators: string[] = ["GT", "EQ", "LT"];
    public datasetIDs: string[] = ["courses"];
    public mfields: string[] = ["avg" , "pass" , "fail" , "audit" , "year"];
    public sfield: string[] =  ["dept" , "id" , "instructor" , "title" , "uuid"];
    public datasets: any[];
    public IDstrings: string[];

    public constructor(query: any) {
        this.keyset = Object.keys(query);
        if ( ! Object.keys(query).includes("WHERE") )       {throw new InsightError("missing WHERE"); }
        if ( ! Object.keys(query).includes("OPTIONS") )       {throw new InsightError("missing OPTIONS"); }
        if (Object.keys(query.WHERE).length !== 1) {throw new InsightError("WHERE should only have 1 key"); }
        if (typeof query.WHERE !== "object")   {throw new InsightError("WHERE not an obj"); }
        if (this.keyset.length !== 2) {throw new InsightError("excess key"); }
        this.WHERE = new FILTER(query);
        this.OPTIONS = new OPTIONS(query);
        this.IDstrings = [];
    }

    public validate() {
        this.validateBody();
        this.validateOptions();
        this.IDstrings = this.IDstrings.concat(this.WHERE.IDstrings, this.OPTIONS.IDstrings);
    }

    public validateBody() {
        this.WHERE.validateFilter();
        this.IDstrings = this.WHERE.IDstrings;
    }
    public validateOptions() {
        this.OPTIONS.validateColumns();
    }

    public validateColumns(columns: any) {
        if ( columns ! instanceof Array)    {throw new InsightError("Columns must be arrary"); }
        if ( columns.length === 0 ) {throw new InsightError("Columns must be non-empty"); }
        if ( " " in columns) {throw new InsightError("Cannot read property 'GROUP' of undefined"); }
    }


    public validateDataset(key: string) {
        const str = key.split("_", 2);
        let ds = str[0];
        let field = str[1];
        if ( ds === "") {throw new InsightError("Referenced dataset cannot be empty string"); }
        if ( ! this.datasetIDs.includes(ds)) {throw new InsightError("dataset not added"); }

    }

    public processQuery(dataset: any): any[] {
        this.datasets = dataset;
        let result: any[] = [];
        this.datasets.forEach((element) => {
            if (this.WHERE.parseFilter(element)) {
                result.push(element);
            }
        });

        let final: any[] = [];
        let required = this.OPTIONS.quiredFields;
        //  filter displayed filed
        //   https://stackoverflow.com/questions/38750705/filter-object-properties-by-key-in-es6
        result.forEach((singleResultObject) => {
            let filtered = Object.keys(singleResultObject)
            .filter((key) => required.includes(key))
            .reduce((obj: any, key) => {
                obj[key] = singleResultObject[key];
                return obj;
            }, {});
            final.push(filtered);

            });
        return final;
    }

}
