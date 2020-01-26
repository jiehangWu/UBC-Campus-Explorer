import { MKey } from "./MKeyFieldPair";
import Query from "./Query";
import { InsightError } from "../IInsightFacade";
import { SKey } from "./SKeyFieldPair";

        // deal with * inputString; todo

export class MyFILTER {
    public AND: MyFILTER[];
    public OR: MyFILTER[];
    public GT: MKey;
    public EQ: MKey;
    public LT: MKey;
    public IS: SKey;
    public NOT: MyFILTER;
    public LogicComparators: string[] = ["AND", "OR"];
    public MComparators: string[] = ["GT", "EQ", "LT"];
    public comparator: string;
    public comparedField: any;
    public whereBlock: any;

    public constructor(query: any) {
        this.whereBlock = query.WHERE;
        this.comparator = Object.keys(this.whereBlock)[0];
        this.comparedField = Object.values(this.whereBlock)[0];
    }

    public validateFilter() {
        if (this.LogicComparators.indexOf(this.comparator) >= 0 ) {
            this.validateLogicalComparators();
        } else if (this.MComparators.indexOf(this.comparator) >= 0) {
            this.validateMComparators();
        } else if (this.comparator === "IS") {
            this.validateSComparators();
        } else if (this.comparator === "NOT") {
            this.validateNegationComparators();
        } else                        {throw new InsightError("Wrong filter key"); }
    }

    // for loop + recursive
    public validateLogicalComparators() {
        if (this.comparator === "AND")   {
            let array: any[] = this.whereBlock.AND;
            let newArray: MyFILTER[] = [];
            array.forEach((element) => {
                newArray.push(new MyFILTER({WHERE: element })); });
            this.AND = newArray;
            if (this.AND.length === 0 ) {throw new InsightError("empty AND"); }
            this.AND.forEach(function (element: MyFILTER) {
                // let query: any = {WHERE: element};
                // let newFilter: MyFILTER = new MyFILTER(query.WHERE);
                // newFilter.validateFilter(); }); }
                element.validateFilter(); }); }

        if (this.comparator === "OR")   {
            let array: any[] = this.whereBlock.OR;
            let newArray: MyFILTER[] = [];
            array.forEach((element) => {
                newArray.push(new MyFILTER({WHERE: element })); });
            this.OR = newArray;
            if (this.OR.length === 0 ) {throw new InsightError("empty OR"); }
            this.OR.forEach(function (element: MyFILTER) {
                // let query: any = {WHERE: element};
                // let newFilter: MyFILTER = new MyFILTER(query.WHERE);
                // newFilter.validateFilter(); }); }
                element.validateFilter(); }); }
    }

    // todo : abstract
    public validateMComparators() {
        if (this.comparator === "GT") {
            this.GT = this.whereBlock.GT;
            if (Object.keys(this.GT).length !== 1)    {throw new InsightError("GT not 1 field"); }
            let pair: MKey = new MKey(this.comparedField);
            pair.validate();
        }
        if (this.comparator === "EQ") {
            this.EQ = this.whereBlock.EQ;
            if (Object.keys(this.EQ).length !== 1)    {throw new InsightError("EQ not 1 field"); }
            let pair: MKey = new MKey(this.comparedField);
            pair.validate();
        }
        if (this.comparator === "LT") {
            this.LT = this.whereBlock.LT;
            if (Object.keys(this.LT).length !== 1)    {throw new InsightError("LT not 1 field"); }
            let pair: MKey = new MKey(this.comparedField);
            pair.validate();
        }
    }

    public validateSComparators() {
        if (Object.keys(this.whereBlock.IS).length !== 1)    {throw new InsightError("IS not 1 field"); }
        let pair: SKey = new SKey(this.comparedField);
        this.IS = pair;
        this.IS.validate();
    }

    public validateNegationComparators() {

        if (Object.keys(this.whereBlock.NOT).length !== 1)          {throw new InsightError("not 1 field"); }
        let query: any = {WHERE: this.whereBlock.NOT};
        let newFilter: MyFILTER = new MyFILTER(query);
        this.NOT = newFilter;
        this.NOT.validateFilter();
    }

    public parseFilter(datapoint: any): boolean {
        let flag = true;
        if (this.LogicComparators.indexOf(this.comparator) >= 0 ) {
            flag = this.parseLogicalComparators(datapoint);
        } else if (this.MComparators.indexOf(this.comparator) >= 0) {
            flag = this.parseMComparators(datapoint);
        } else if (this.comparator === "IS") {
            flag = this.parseSComparators(datapoint);
        } else if (this.comparator === "NOT") {
            flag = this.parseNegationComparators(datapoint);
        }
        return flag;
    }

//  recursively parse filter, only AND / OR
    public parseLogicalComparators(datapoint: any): boolean {
        if (this.comparator === "AND") {
            let flag: boolean = true;
            let array: any[] = this.whereBlock.AND;
            let newArray: MyFILTER[] = [];
            array.forEach((element) => {
                newArray.push(new MyFILTER({WHERE: element })); });
            this.AND = newArray;
            const ANDarrary: boolean[] = this.AND.map((element) => element.parseFilter(datapoint));
            ANDarrary.forEach((parsedFilter) => flag = flag && parsedFilter);
            return flag;
        }
        if (this.comparator === "OR") {
            let flag: boolean = false;
            let array: any[] = this.whereBlock.OR;
            let newArray: MyFILTER[] = [];
            array.forEach((element) => {
                newArray.push(new MyFILTER({WHERE: element })); });
            this.OR = newArray;
            const ORarrary: boolean[] = this.OR.map((element) => element.parseFilter(datapoint));
            ORarrary.forEach((parsedFilter) => flag = flag || parsedFilter);
            return flag;
        }
    }

    //  pass in an dataobject (checking on each datapoint)
    public parseMComparators(datapoint: any): boolean {
        let mkey =  new MKey(this.comparedField);
        let searchField = mkey.field;
        let mvalue = mkey.value;
        if (this.comparator === "GT") {
            return datapoint[searchField] > mvalue;
        }
        if (this.comparator === "EQ") {
            return mvalue === datapoint[searchField];
        }
        if (this.comparator === "LT") {
            // throw new Error(mvalue + " | " + datapoint[searchField]);
            return datapoint[searchField] < mvalue;
        }
    }

    public parseSComparators(datapoint: any): boolean {
        let skey =  new SKey(this.comparedField);
        // skey.updateSkey();
        let searchField: string = skey.field;
        let svalue = skey.value;
        // https://stackoverflow.com/questions/2167602/optimum-way-to-compare-strings-in-javascript
        return (svalue.localeCompare(datapoint[searchField]) === 0);
    }

    public parseNegationComparators(datapoint: any): boolean {
        let query: any = {WHERE: this.whereBlock.NOT};
        let newFilter: MyFILTER = new MyFILTER(query);
        this.NOT = newFilter;
        return ! this.NOT.parseFilter(datapoint);
    }

}
