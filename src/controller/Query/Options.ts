import { MKey } from "./MKeyFieldPair";
import { SKey } from "./SKeyFieldPair";
import { InsightError } from "../IInsightFacade";

export class OPTIONS {
    public Columns: any[];
    public ORDER: any;
    public optionBlock: any;
    public IDstrings: string[];
    public allFields: string[] = ["avg" , "pass" , "fail" , "audit" , "year",
    "dept" , "id" , "instructor" , "title" , "uuid"];
    public quiredFields: string[];
    public orderField: string;

    public constructor(query: any) {
        this.optionBlock = query.OPTIONS;
        this.IDstrings = [];

        if (! Object.keys(this.optionBlock).includes("COLUMNS")) {
            throw new InsightError("missing columns");
        }

        this.Columns = this.optionBlock.COLUMNS;

        //  have to check if data set and
        if (Object.keys(this.optionBlock).includes("ORDER")) {
            this.ORDER = this.optionBlock.ORDER;
            this.orderField = this.ORDER.split("_", 2)[1];
            let OrderId = this.ORDER.split("_", 2)[0];

            this.IDstrings.push(OrderId);
        }
    }

    public validateColumns() {
        let comparedPair: string[] = [];
        let displayField: string[] = [];

        let IDs: string[] = [];
        this.Columns.forEach((element) => {
            comparedPair = element.split("_", 2);
            IDs = IDs.concat([comparedPair[0]]);
            if (! this.allFields.includes(comparedPair[1])) {
                throw new InsightError("Invalid field courses_xxx");
            }

            displayField.push(comparedPair[1]);
        });

        this.IDstrings = this.IDstrings.concat(IDs);
        this.quiredFields = displayField;

        if (! this.quiredFields.includes(this.orderField)) {
            throw new InsightError("Order field not in column");
        }
    }

    // https://www.sitepoint.com/sort-an-array-of-objects-in-javascript/
    public sort(res: any[]): any[] {
        const sortedField = this.orderField;

        function compare(a: any, b: any) {
            // Use toUpperCase() to ignore character casing
            const bandA = a[sortedField];
            const bandB = b[sortedField];

            let comparison = 0;
            if (bandA > bandB) {
            comparison = 1;
            } else if (bandA < bandB) {
            comparison = -1;
            }
            return comparison;
        }

        res.forEach((object) => {
            Object.keys(object).forEach((key) => {
            key = this.IDstrings[0].concat(key);
            });
       });

        return res.sort(compare);

    }

}
