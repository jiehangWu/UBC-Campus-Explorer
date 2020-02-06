import { Filter } from "./Filter";
// import { KEYFIELDPAIR, MKey, SKey } from "./KEYFIELDPAIR";
import { OPTIONS } from "./Options";
import { InsightError, InsightDataset, ResultTooLargeError } from "../IInsightFacade";


export default class Query {
    public WHERE: Filter;
    public OPTIONS: OPTIONS;
    private keyset: string[];
    private datasets: any[];
    public IDstrings: string[];
    private emptyWhere?: boolean;

    public constructor(query: any) {
        this.keyset = Object.keys(query);
        this.checkStructure(query);
    }

    //  check overall structure: 1. Where: missing/ empty
    private checkStructure(query: any) {
        if (!this.keyset.includes("WHERE")) { throw new InsightError("missing WHERE"); }
        if (!this.keyset.includes("OPTIONS")) { throw new InsightError("missing OPTIONS"); }

        if (Object.keys(query.WHERE).length === 0) {
            this.emptyWhere = true;
        } else {
            this.emptyWhere = false;
        }

        if (Object.keys(query.WHERE).length > 1) { throw new InsightError("WHERE should only have 1 key"); }
        if (typeof query.WHERE !== "object") { throw new InsightError("WHERE not an obj"); }
        if (this.keyset.length !== 2) { throw new InsightError("excess key"); }

        if (this.emptyWhere === false) {
            this.WHERE = new Filter(query);
        }
        this.OPTIONS = new OPTIONS(query);
        this.IDstrings = [];
    }

    public validate() {
        if (this.emptyWhere === false) {
            this.WHERE.validateFilter();
            this.IDstrings = this.IDstrings.concat(this.WHERE.IDstrings);
        }
        this.OPTIONS.validateColumns();

        this.IDstrings = this.OPTIONS.IDstrings;
    }

    // private validateDataset(key: string) {
    //     const str = key.split("_", 2);
    //     let ds = str[0];
    //     if (ds === "") { throw new InsightError("Referenced dataset cannot be empty string"); }
    //     if (!this.datasetIDs.includes(ds)) { throw new InsightError("dataset not added"); }

    // }

    public processQuery(dataset: any): any[] {
        this.datasets = dataset;
        let results: any[] = [];

        if (this.emptyWhere === true) {
            if (this.datasets.length > 5000) {
                throw new ResultTooLargeError(">5000");
            } else {
                dataset.forEach((datapoint: any) => {
                    this.postProcess(datapoint);
                });
                return dataset;
            }
        } else {
            this.datasets.forEach((element) => {
                if (this.WHERE.parseFilter(element)) {
                    results.push(element);
                }
            });

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

}
