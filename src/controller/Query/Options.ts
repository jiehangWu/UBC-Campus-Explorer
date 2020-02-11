import { InsightError } from "../IInsightFacade";
import { Sort } from "./Sort";

export class Options {
    public Columns: any[];
    public ORDER: string | Sort;
    public optionBlock: any;
    public IDstrings: string[];
    private allFields: string[] = ["avg" , "pass" , "fail" , "audit" , "year",
    "dept" , "id" , "instructor" , "title" , "uuid"];
    public quiredFields: string[];
    public orderField: string;

    public constructor(query: any) {
        this.optionBlock = query.OPTIONS;
        this.IDstrings = [];

        //  2 if blocks below to check if wrong key in options
        Object.keys(this.optionBlock).forEach((key) => {
            if (! (key === "COLUMNS" || key === "ORDER")) {
                throw new InsightError("Wrong key in options");
            }
        });

        if ( Object.keys(this.optionBlock).length === 1 &&
        (! Object.keys(this.optionBlock).includes("COLUMNS") ) ) {
            throw new InsightError("missing columns");
        }

        if ( Object.keys(this.optionBlock).length === 2 &&
        (! ((Object.keys(this.optionBlock).includes("COLUMNS")) &&
        (Object.keys(this.optionBlock).includes("ORDER")) )) ) {
            throw new InsightError("wrong keys in options");
        }

        // if (! Object.keys(this.optionBlock).includes("COLUMNS")) {
        //     throw new InsightError("missing columns");
        // }

        this.Columns = this.optionBlock.COLUMNS;

        if (Object.keys(this.optionBlock).includes("ORDER")) {
            if (typeof this.optionBlock.ORDER !== "string") {
                throw new InsightError("wrong type in order");
            }
            this.ORDER = this.optionBlock.ORDER as string;

            this.validateOrder();
        }
    }

    public validateOrder() {
        if (this.ORDER == null || typeof this.ORDER !== "string") {
            throw new InsightError("undefined order type");
        }

        //  two cases: order = string | obj wiz dir and keys as an arrary
        if (typeof this.ORDER === "string") {
            this.orderField = this.ORDER.split("_", 2)[1];
            if (! this.allFields.includes(this.orderField)) {
                throw new InsightError("invalid order type");
            }

            let OrderId = this.ORDER.split("_", 2)[0];

            this.IDstrings.push(OrderId);
            // realte to the situation that difference in checking idstrings
        } else if (typeof this.ORDER === "object") {
            let sort: Sort = this.ORDER;
            sort.validate();
        }
    }

    public validateColumns() {
        let comparedPair: string[] = [];
        let displayField: string[] = [];

        if (!Array.isArray(this.Columns)) {
            throw new InsightError("Columns not an array");
        }

        if (this.Columns === undefined || this.Columns.length === 0) {
            throw new InsightError("Columns must be arrary");
        }

        if (" " in this.Columns) { throw new InsightError("Cannot read property 'GROUP' of undefined"); }

        let IDs: string[] = [];
        this.Columns.forEach((element) => {
            if (typeof element !== "string") {
                throw new InsightError("");
            }
            comparedPair = element.split("_", 2);
            IDs = IDs.concat([comparedPair[0]]);
            if (! this.allFields.includes(comparedPair[1])) {
                    throw new InsightError("Invalid field courses_xxx");
                }

            if (typeof element !== "string") {
                throw new InsightError(typeof element);
            }

            displayField.push(comparedPair[1]);
        });

        this.IDstrings = this.IDstrings.concat(IDs);
        this.quiredFields = displayField;

        if (Object.keys(this.optionBlock).includes("ORDER")) {
            if (! this.quiredFields.includes(this.orderField)) {
                throw new InsightError("Order field not in column");
        }
     }
    }

    // https://www.sitepoint.com/sort-an-array-of-objects-in-javascript/
    public sort(res: any[]): void {
        const sortedField = this.processField(this.orderField);

        // for loop to break tie
        function compare(a: any, b: any) {
            const valA = a[sortedField];
            const valB = b[sortedField];

            let comparison = 0;
            if (valA > valB) {
            comparison = 1;
            } else if (valA < valB) {
            comparison = -1;
            }
            return comparison;
        }

        res.sort(compare);

    }

    private processField(field: string): string {
        if (this.IDstrings.length === 0) {
            return "";
        }

        const id: string = this.IDstrings[0];

        return id + "_" + field;
    }
}
