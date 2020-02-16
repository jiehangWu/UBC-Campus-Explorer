import { Filter } from "./Filter";
import { Options } from "./Options";
import { InsightError, ResultTooLargeError } from "../IInsightFacade";
import Transformation from "./Transformation";
import { promises } from "dns";


export default class Query {
    public WHERE: Filter;
    public OPTIONS: Options;
    public TRANSFORMATION: Transformation;

    private keyset: string[];
    private datasets: any[];
    public IDstrings: string[];

    private emptyWhere?: boolean;
    private hasTrans?: boolean;

    public constructor(query: any) {
        if (!query)                                  { throw new InsightError("Query empty or null"); }
        this.keyset = Object.keys(query);
        this.checkQueryStructure(query);
        this.IDstrings = [];
    }

    private checkQueryStructure(query: any) {
        Object.keys(query).forEach((key) => {
            if (! ["WHERE", "OPTIONS", "TRANSFORMATIONS"].includes(key)) {
                throw new InsightError("Excess/ Wrong key in query");
            }
        });
        if (this.keyset.length > 3)                { throw new InsightError("excess key"); }
        if (!this.keyset.includes("WHERE"))          { throw new InsightError("missing WHERE"); }
        if (typeof query.WHERE !== "object")         { throw new InsightError("WHERE not an obj"); }
        if (Object.keys(query.WHERE).length > 1)     { throw new InsightError("WHERE should at most have 1 key"); }
        if (Object.keys(query.WHERE).length === 0) {
            this.emptyWhere = true;
        } else {
            this.emptyWhere = false;
            this.WHERE = new Filter(query);
        }

        if (!this.keyset.includes("OPTIONS"))        { throw new InsightError("missing OPTIONS"); }
        this.OPTIONS = new Options(query);

        if (this.keyset.includes("TRANSFORMATIONS")) {
            this.hasTrans = true;
            if (!query["TRANSFORMATIONS"])       { throw new InsightError("TRANS empty or null"); }
            this.TRANSFORMATION = new Transformation(query["TRANSFORMATIONS"]);
        } else {
            this.hasTrans = false;
        }

    }

    public validate() {
        if (this.emptyWhere === false) {
            this.WHERE.validateFilter();
            this.IDstrings = this.IDstrings.concat(this.WHERE.IDstrings);
        }

        if (this.hasTrans === true) {
            this.TRANSFORMATION.validate();
            this.OPTIONS.validateTransColumnCoverage(this.TRANSFORMATION.groupKeys, this.TRANSFORMATION.applyKeys);
            this.IDstrings = this.IDstrings.concat(this.TRANSFORMATION.IDstrings);
        }
        // sequence that validateTransColumnCoverage first coz always have to check if it matches as priority
        this.OPTIONS.validateColumns(this.hasTrans);

        this.IDstrings = this.IDstrings.concat(this.OPTIONS.IDstrings);
    }

    // add IDstring to fields in display
    private postProcess(result: any): void {
        if (this.IDstrings.length === 0) {
            return;
        }

        const id: string = this.IDstrings[0];
        const keys = Object.keys(result);

        for (let key of keys) {
            if (!this.hasTrans || (! this.TRANSFORMATION.applyKeys.includes(key))) {
                result[id + "_" + key] = result[key];
                delete result[key];
            }
        }
    }

    public processQuery(dataset: any): any[] {
        this.datasets = dataset;
        let results: any[] = [];

        if (this.emptyWhere === true) {
                results = dataset;
        } else {
            this.datasets.forEach((element) => {
                if (this.WHERE.parseFilter(element)) {
                    results.push(element);
                }
            });
        }

        if (this.hasTrans) {
            results = this.TRANSFORMATION.processTransformation(results);
        }
        let final: any[] = [];
        let required = this.OPTIONS.quiredFields;
        //  filter displayed filed
        //   https://stackoverflow.com/questions/38750705/filter-object-properties-by-key-in-es6
        results.forEach((result) => {
                let filtered = Object.keys(result)
                    .filter((key) => required.includes(key))
                    .reduce((obj: any, key) => {

                        obj[key] = result[key];
                        return obj;
                    }, {});

                this.postProcess(filtered);
                final.push(filtered);
            });


        this.OPTIONS.sort(final);

        if (final.length > 5000) {
                throw new ResultTooLargeError("> 5000");
        }

        return final;
    }

}
