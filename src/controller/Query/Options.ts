import { InsightError } from "../IInsightFacade";


export class Options {
    public Columns: any[];
    public ORDER: string;
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

        if (Object.keys(this.optionBlock).includes("ORDER")) {
            this.ORDER = this.optionBlock.ORDER as string;
            this.validateOrder();
        }
    }

    public validateOrder() {
        if (this.ORDER == null || typeof this.ORDER !== "string") {
            throw new InsightError("undefined order type");
        }

        this.orderField = this.ORDER.split("_", 2)[1];
        if (! this.allFields.includes(this.orderField)) {
            throw new InsightError("invalid order type");
        }

        let OrderId = this.ORDER.split("_", 2)[0];


        this.IDstrings.push(OrderId);
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

        if (Object.keys(this.optionBlock).includes("ORDER")) {
            if (! this.quiredFields.includes(this.orderField)) {
                throw new InsightError("Order field not in column");
        }
     }
    }

    // https://www.sitepoint.com/sort-an-array-of-objects-in-javascript/
    public sort(res: any[]): any[] {
        const sortedField = this.processField(this.orderField);

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

        return res.sort(compare);

    }

    private processField(field: string): string {
        if (this.IDstrings.length === 0) {
            return "";
        }

        const id: string = this.IDstrings[0];

        return id + "_" + field;
    }
}
