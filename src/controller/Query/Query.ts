import {MyFILTER} from "./Filter";
// import { KEYFIELDPAIR, MKey, SKey } from "./KEYFIELDPAIR";
import {MyOPTIONS} from "./Options";
import {InsightError, InsightDataset} from "../IInsightFacade";
import { rejects } from "assert";
import { queryParser } from "restify";
import { Key } from "readline";

export default class Query {
    public WHERE: MyFILTER;
    public OPTIONS: MyOPTIONS;
    public keyset: string[];
    public LogicComparators: string[] = ["AND", "OR"];
    public MComparators: string[] = ["GT", "EQ", "LT"];
    public datasetIDs: string[] = ["courses"];
    public mfields: string[] = ["avg" , "pass" , "fail" , "audit" , "year"];
    public sfield: string[] =  ["dept" , "id" , "instructor" , "title" , "uuid"];
    public datasets: InsightDataset[];

    public constructor(query: any, dataset: InsightDataset[]) {
        this.keyset = Object.keys(query);
        if ( Object.keys(query).indexOf("WHERE") !== 0 )       {throw new InsightError("missing WHERE"); }
        if ( Object.keys(query).indexOf("OPTIONS") !== 1 )       {throw new InsightError("missing OPTIONS"); }
        if (Object.keys(query.WHERE).length !== 1) {throw new InsightError("WHERE should only have 1 key"); }
        if (typeof query.WHERE !== "object")   {throw new InsightError("WHERE not an obj"); }
        if (this.keyset.length !== 2) {throw new InsightError("excess key"); }
        this.WHERE = new MyFILTER(query);
        // this.OPTIONS = query.OPTIONS as MyOPTIONS;
        this.datasets = dataset;
    }

    public validate(query: any) {
        this.syntaxCheck(query);
        this.semanticCheck(query);
    }
    // public validateDS(queryObj: any) {
    //     let q1 = queryObj as Query;
    //     if ( Object.keys(queryObj).indexOf("WHERE") !== 0 )       {throw new InsightError("missing WHERE"); }
    //     if (!this.syntaxCheck(q1 ) && this.semanticCheck(q1)) {
    //         this.processQuery(q1); }
    // }

    public syntaxCheck(query: Query) {
        this.validateBody(query);
        // this.validateOptions(query);
    }

    public validateBody(query: Query) {
        let filter: MyFILTER = new MyFILTER(query);
        filter.validateFilter();
    }

    public validateOptions(query: Query): boolean {
        if ("OPTIONS" ! in query) {throw new InsightError("missing OPTIONS"); }
        if ("COLUMNS" ! in query)           {throw new InsightError("missing columns"); }
        this.validateColumns(query.OPTIONS);
        // // if (order exists)
        // checkOrder
        const l1 = Object.keys(query.OPTIONS.Column).length;
        if (l1 > 2 || l1 < 1 ) {   throw new InsightError(""); }
        return false;
    }

    public validateColumns(columns: any) {
        if ( columns ! instanceof Array)    {throw new InsightError("Columns must be arrary"); }
        if ( columns.length === 0 ) {throw new InsightError("Columns must be non-empty"); }
        if ( " " in columns) {throw new InsightError("Cannot read property 'GROUP' of undefined"); }
    }

    // detect multiple datast
    public semanticCheck(query: Query): boolean {
        let flag: boolean = true;
        //  check courses_avg right or not
            // this.keyset.forEach(element => {
                //
            // });
        return flag;
// todo: link this to key fields in the program
        //   wrong field  eg courses_avgg

    }

    public validateDataset(key: string) {
        const str = key.split("_", 2);
        let ds = str[0];
        let field = str[1];
        if ( ds === "") {throw new InsightError("Referenced dataset cannot be empty string"); }
        if ( ! this.datasetIDs.includes(ds)) {throw new InsightError("dataset not added"); }

    }

    public processQuery(): any[] {
        let result: any[] = [];
        this.datasets.forEach((element) => {
            if (this.WHERE.parseFilter(element)) {
                result.push(element);
            }
        });
        return result;
    }
}
