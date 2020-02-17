import { InsightError } from "../IInsightFacade";
import { Sort } from "./Sort";

export class Options {
    public Columns: any[];
    public ORDER: string | Sort;
    public optionBlock: any;
    public IDstrings: string[];
    private allFields4Courses: string[] = ["avg" , "pass" , "fail" , "audit" , "year",
    "dept" , "id" , "instructor" , "title" , "uuid"];

    private allFields4Rooms: string[] = ["lat" , "lon" , "seats" , "fullname" , "shortname" ,
     "number" , "name" , "address" , "type" , "furniture" , "href" ];
    //  should also plus the apply keys

    public quiredFields: string[];
    public orderField: string;

    private applyKeys: any;
    private groupKeys: string[];

    public constructor(query: any) {
        if (!query.OPTIONS) {
            throw new InsightError("Option null or empty");
        }
        this.optionBlock = query.OPTIONS;
        this.IDstrings = [];

        this.applyKeys = [];

        //  2 if blocks below to check if wrong key in options
        Object.keys(this.optionBlock).forEach((key) => {
            if (! (key === "COLUMNS" || key === "ORDER")) {
                throw new InsightError("Excess Key");
            }
        });

        this.checkOptionKeySet();

        this.Columns = this.optionBlock.COLUMNS;
        //  first check columns here, just to separate apart from the dataset id check
        if (!Array.isArray(this.Columns)) {
            throw new InsightError("Columns not an array");
        }

        if (this.Columns === undefined || this.Columns.length === 0) {
            throw new InsightError("Columns must be non-empty arrary");
        }

        if (Object.keys(this.optionBlock).includes("ORDER")) {
            if (! this.optionBlock.ORDER ) {
                throw new InsightError("Order is Null or empty");
            }
            this.ORDER = this.optionBlock.ORDER;

            if (typeof this.ORDER !== "string") {
                this.ORDER = new Sort(this.ORDER);
            }
            this.validateOrder();
        }
    }

    private checkOptionKeySet() {
        //  2 if blocks below to check if wrong key in options
        Object.keys(this.optionBlock).forEach((key) => {
            if (! (key === "COLUMNS" || key === "ORDER" || key === "TRANSFORMATIONS")) {
                throw new InsightError("Excess Key");
            }
        });

        if ( Object.keys(this.optionBlock).length === 1 &&
        (! Object.keys(this.optionBlock).includes("COLUMNS") ) ) {
            throw new InsightError("missing columns");
        }

        // possible Situations: 1Column, 2Column & Order
        if ( Object.keys(this.optionBlock).length === 2 &&
            (! ( (Object.keys(this.optionBlock).includes("COLUMNS")) &&
            (Object.keys(this.optionBlock).includes("ORDER"))  )) ) {
            throw new InsightError("wrong keys in options 2");
        }
    }

    public validateOrder() {
        // if (this.ORDER == null || typeof this.ORDER !== "string") {
        if (this.ORDER == null ) {
            throw new InsightError("undefined order type");
        }

        //  two cases: order = string | obj wiz dir and keys as an arrary
        if (typeof this.ORDER === "string") {
            this.orderField = this.ORDER.split("_", 2)[1];
            // if (! this.allFields.includes(this.orderField)) {
            //     throw new InsightError("invalid order type for courses");
            // }

            let OrderId = this.ORDER.split("_", 2)[0];

            this.IDstrings.push(OrderId);

            if (! this.Columns.includes(this.ORDER)) {
                throw new InsightError("Order field not in column");
            }
            // realte to the situation that difference in checking idstrings
        } else if (typeof this.ORDER === "object") {
            let sort: Sort = new Sort(this.ORDER);
            sort.validate();

            // check if in columns
            let orderInColumn = true;

            sort.keys.forEach((key: any) => {
                orderInColumn = orderInColumn && (this.Columns.includes(key));
                });
            if (! orderInColumn) {
                throw new InsightError("Sort order not in Columns");
            }

            this.IDstrings.concat(sort.IDstrings);
        }
    }

    public validateColumns(hasTrans: boolean) {
        let comparedPair: string[] = [];
        let displayField: string[] = [];
        let IDinColumn: string[] = [];

        // if (" " in this.Columns) { throw new InsightError("Cannot read property 'GROUP' of undefined"); }

        IDinColumn = IDinColumn.concat(this.validateOrderWizoutTrans(comparedPair, displayField, IDinColumn, hasTrans));

        displayField = displayField.concat(this.applyKeys);

        this.IDstrings = this.IDstrings.concat(IDinColumn);
        this.quiredFields = displayField;

    }

    //  checking the validity of keys in columns and giving back the result to validate columns, has to separate because
    //  of line issue
    private validateOrderWizoutTrans(comparedPair: any, displayField: any, IDsInColumn: any, hasTrans: any): any {
        this.Columns.forEach((element) => {
            if (typeof element !== "string") {
                throw new InsightError("");
            }

            if (hasTrans) {
                if (! this.applyKeys.includes(element)) {
                    //  if not apply key
                    comparedPair = element.split("_", 2);
                    displayField.push(comparedPair[1]);
                    IDsInColumn = IDsInColumn.concat([comparedPair[0]]);
                    if (comparedPair[0] === "courses") {
                        if (! this.allFields4Courses.includes(comparedPair[1])) {
                            throw new InsightError("Invalid field courses_xxx");
                        }
                    } else if (comparedPair[0] === "rooms") {
                        if (! this.allFields4Rooms.includes(comparedPair[1])) {
                            throw new InsightError("Invalid field rooms_xxx");
                        }
                    }
                }
            } else { // not has trans
                comparedPair = element.split("_", 2);
                displayField.push(comparedPair[1]);
                IDsInColumn = IDsInColumn.concat([comparedPair[0]]);
                if (comparedPair[0] === "courses") {
                    if (! this.allFields4Courses.includes(comparedPair[1])) {
                        throw new InsightError("Invalid field courses_xxx");
                    }
                } else if (comparedPair[0] === "rooms") {
                    if (! this.allFields4Rooms.includes(comparedPair[1])) {
                        throw new InsightError("Invalid field rooms_xxx");
                    }
                }
            }
        });
        return IDsInColumn;
    }

    //  check if columns is covered by all when there is transformation
    public validateTransColumnCoverage(groupArray: string[], applyArray: string[]) {
        this.applyKeys = applyArray;
        this.groupKeys = groupArray;

        let coverColumn = true;
        let checkedFields = this.applyKeys.concat(this.groupKeys);

        this.Columns.forEach((key: any) => {
                coverColumn = coverColumn && (checkedFields.includes(key));
            });

        if (!(coverColumn)) {
            throw new InsightError("Keys in COLUMNS must be in GROUP or APPLY when TRANSFORMATIONS is present");
        }
    }

    //  todo: refactor the names here
    // https://www.sitepoint.com/sort-an-array-of-objects-in-javascript/
    public sort(res: any[]): void {

        // for loop to break tie
        if ( this.ORDER instanceof Sort) {

            // https://stackoverflow.com/questions/11379361/how-to-sort-an-array-of-objects-
            // with-multiple-field-values-in-javascript
            // version2
            let OrderDir = this.ORDER.dir;
            function dynamicSort(key: any) {
                return function (obj1: any, obj2: any) {
                    if (OrderDir === "DOWN") {
                        return obj1[key] > obj2[key] ? -1
                        : obj1[key] < obj2[key] ? 1 : 0;
                    }
                    if (OrderDir === "UP") {
                        return obj1[key] > obj2[key] ? 1
                        : obj1[key] < obj2[key] ? -1 : 0;
                        }
                };
            }

            function dynamicSortMultipleKeys(arrayToSort: any) {
                let tempArray: any = arrayToSort;
                return function (obj1: any, obj2: any) {
                    let i = 0, result = 0, numberOfProperties = tempArray.length;
                    while ( result === 0 && i < numberOfProperties) {
                        result = dynamicSort(tempArray[i])(obj1, obj2);
                        i++;
                    }
                    return result;
                };
            }
            res.sort(dynamicSortMultipleKeys(this.ORDER.keys));
        }

        // breaking tie from above

        if (typeof this.ORDER === "string") {
            const sortedField = this.processField(this.orderField);
            function compare(a: any, b: any) {
                const valA = a[sortedField];
                const valB = b[sortedField];
        // refactor: this could be a lot shorter
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
    }

    private processField(field: string): string {
        if (this.IDstrings.length === 0) {
            return "";
        }

        const id: string = this.IDstrings[0];

        return id + "_" + field;
    }
}
