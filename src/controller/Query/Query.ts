import { Filter } from "./Filter";
import { Options } from "./Options";
import { InsightError, ResultTooLargeError } from "../IInsightFacade";


export default class Query {
    public WHERE: Filter;
    public OPTIONS: Options;
    private keyset: string[];
    private datasets: any[];
    public IDstrings: string[];

    private emptyWhere?: boolean;
    private Transformation?: boolean;

    public constructor(query: any) {
        this.keyset = Object.keys(query);
        this.checkQueryStructure(query);
        this.IDstrings = [];
    }

    private checkQueryStructure(query: any) {
        if (!query)                                  { throw new InsightError("Query empty or null"); }
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

        if (this.keyset.includes("TRANSFORMATION")) { throw new InsightError("missing WHERE"); }
    }

    public validate() {
        if (this.emptyWhere === false) {
            this.WHERE.validateFilter();
            this.IDstrings = this.IDstrings.concat(this.WHERE.IDstrings);
        }
        this.OPTIONS.validateColumns();

        this.IDstrings = this.OPTIONS.IDstrings;
    }

    // add IDstring to fields in display
    private postProcess(result: any): void {
        if (this.IDstrings.length === 0) {
            return;
        }

        const id: string = this.IDstrings[0];
        const keys = Object.keys(result);

        for (let key of keys) {
            result[id + "_" + key] = result[key];
            delete result[key];
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
