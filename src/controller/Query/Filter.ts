import { MKey } from "./MKey";
import { InsightError } from "../IInsightFacade";
import { SKey } from "./SKey";

export class Filter {
    public AND: Filter[];
    public OR: Filter[];
    public GT: MKey;
    public EQ: MKey;
    public LT: MKey;
    public IS: SKey;
    public NOT: Filter;
    private LogicComparators: string[] = ["AND", "OR"];
    private MComparators: string[] = ["GT", "EQ", "LT"];
    public comparator: string;
    public comparedField: any;
    public whereBlock: any;
    public IDstrings: string[];

    public constructor(query: any) {
        this.whereBlock = query.WHERE;
        this.comparator = Object.keys(this.whereBlock)[0];
        this.comparedField = Object.values(this.whereBlock)[0];
        if (Object.keys(this.comparedField).length === 0 && this.comparedField.constructor === Object) {
            throw new InsightError("no key in filter");
        }
        this.IDstrings = [];
    }

    public validateFilter() {
        if (this.LogicComparators.indexOf(this.comparator) >= 0) {
            this.validateLogicalComparators();
        } else if (this.MComparators.indexOf(this.comparator) >= 0) {
            this.validateMComparators();
        } else if (this.comparator === "IS") {
            this.validateSComparators();
        } else if (this.comparator === "NOT") {
            this.validateNegationComparators();
        } else {
            throw new InsightError("Wrong filter key");
        }
    }

    private validateLogicalComparators() {
        if (this.comparator === "AND") {
            this.validateAnd();
        } else {
            this.validateOr();
        }
    }

    private validateAnd() {
        let array: any[] = this.whereBlock.AND;
        let newArray: Filter[] = [];
        if (! Array.isArray(array)) {
                throw new InsightError("And is not an array");
            }
            //  instantiate and then push each json object into recursive check.
        array.forEach((element) => {
                if (Object.keys(element).length === 0 && element.constructor === Object) {
                    throw new InsightError("empty in logical array");
                }
                if (!(typeof element === "object" && element !== null)) {
                    throw new InsightError("Logic arrary not an object");
                }
                newArray.push(new Filter({ WHERE: element }));
            });

        this.AND = newArray;
        if (this.AND.length === 0) {
            throw new InsightError("empty AND");
        }

        // dealing with Dataset ID, pushing the  to an array
        let IDs: string[] = [];
        this.AND.forEach(function (element: Filter) {
                element.validateFilter();
                IDs = IDs.concat(element.IDstrings);
                if (!["AND", "NOT", "OR"].includes(element.comparator)) {
                    IDs = IDs.concat(element.IDstrings);
                }
            });

        this.IDstrings = this.IDstrings.concat(IDs);
    }

    private validateOr() {
        let array: any[] = this.whereBlock.OR;
        let newArray: Filter[] = [];
        if (! Array.isArray(array)) {
            throw new InsightError("Or is not an array");
        }
        array.forEach((element) => {
            if (Object.keys(element).length === 0 && element.constructor === Object) {
                throw new InsightError("empty object in Logical Array");
            }
            if (!(typeof element === "object" && element !== null)) {
                throw new InsightError("Logic arrary not an object");
            }
            newArray.push(new Filter({ WHERE: element }));
        });

        this.OR = newArray;
        if (this.OR.length === 0) {
             throw new InsightError("empty OR");
        }

        let IDs: string[] = [];
        this.OR.forEach(function (element: Filter) {
            element.validateFilter();
            IDs = IDs.concat(element.IDstrings);

            if (!["AND", "NOT", "OR"].includes(element.comparator)) {
                IDs = IDs.concat(element.IDstrings);
            }
        });

        this.IDstrings = this.IDstrings.concat(IDs);
    }


    public validateMComparators() {
        if (this.comparator === "GT") {
            this.GT = this.whereBlock.GT;
            if (Object.keys(this.GT).length !== 1) {
                throw new InsightError("GT not 1 field");
            }

            let pair: MKey = new MKey(this.comparedField);
            pair.validate();
            this.IDstrings.push(pair.getIDstring());
        }

        if (this.comparator === "EQ") {
            this.EQ = this.whereBlock.EQ;
            if (Object.keys(this.EQ).length !== 1) {
                throw new InsightError("EQ not 1 field");
            }
            let pair: MKey = new MKey(this.comparedField);
            pair.validate();
            this.IDstrings.push(pair.getIDstring());
        }

        if (this.comparator === "LT") {
            this.LT = this.whereBlock.LT;
            if (Object.keys(this.LT).length !== 1) {
                throw new InsightError("LT not 1 field");
            }
            let pair: MKey = new MKey(this.comparedField);
            pair.validate();
            this.IDstrings.push(pair.getIDstring());
        }
    }

    public validateSComparators() {
        if (Object.keys(this.whereBlock.IS).length !== 1) {
            throw new InsightError("IS not 1 field");
        }
        let pair: SKey = new SKey(this.comparedField);
        this.IS = pair;
        this.IS.validate();
        this.IDstrings.push(pair.getIDstring());
    }

    public validateNegationComparators() {

        if (Object.keys(this.whereBlock.NOT).length !== 1) {
            throw new InsightError("not 1 field");
        }
        let query: any = { WHERE: this.whereBlock.NOT };
        let newFilter: Filter = new Filter(query);
        this.NOT = newFilter;
        this.NOT.validateFilter();

        this.IDstrings = this.IDstrings.concat(this.NOT.IDstrings);
    }

    public parseFilter(datapoint: any): boolean {
        let flag = true;
        if (this.LogicComparators.indexOf(this.comparator) >= 0) {
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
            let newArray: Filter[] = [];
            array.forEach((element) => {
                newArray.push(new Filter({ WHERE: element }));
            });
            this.AND = newArray;
            const ANDarrary: boolean[] = this.AND.map((element) => element.parseFilter(datapoint));
            ANDarrary.forEach((parsedFilter) => flag = flag && parsedFilter);
            return flag;
        }

        if (this.comparator === "OR") {
            let flag: boolean = false;
            let array: any[] = this.whereBlock.OR;
            let newArray: Filter[] = [];
            array.forEach((element) => {
                newArray.push(new Filter({ WHERE: element }));
            });
            this.OR = newArray;
            const ORarrary: boolean[] = this.OR.map((element) => element.parseFilter(datapoint));
            ORarrary.forEach((parsedFilter) => flag = flag || parsedFilter);
            return flag;
        }
    }

    //  pass in an dataobject (checking on each datapoint)
    public parseMComparators(datapoint: any): boolean {
        let mkey = new MKey(this.comparedField);
        let searchField = mkey.field;
        let mvalue = mkey.value;
        if (this.comparator === "GT") {
            return datapoint[searchField] > mvalue;
        }
        if (this.comparator === "EQ") {
            return mvalue === datapoint[searchField];
        }
        if (this.comparator === "LT") {
            return datapoint[searchField] < mvalue;
        }
    }

    public parseSComparators(datapoint: any): boolean {
        let skey =  new SKey(this.comparedField);
        return skey.checkSfield(datapoint);
    }

    public parseNegationComparators(datapoint: any): boolean {
        let query: any = { WHERE: this.whereBlock.NOT };
        let newFilter: Filter = new Filter(query);
        this.NOT = newFilter;
        return !this.NOT.parseFilter(datapoint);
    }

}
