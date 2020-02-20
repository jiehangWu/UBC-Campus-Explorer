import { InsightError } from "../IInsightFacade";
import { Applyrule } from "./Applyrule";


export default class Transformation {
    public GROUP: string[];
    public APPLY: Applyrule[];
    public value: string;

    public applyKeys: string[];
    public groupKeys: string[];

    public IDstrings: string[];
    private allFields4Courses: string[] = ["avg" , "pass" , "fail" , "audit" , "year",
    "dept" , "id" , "instructor" , "title" , "uuid"];

    private allFields4Rooms: string[] = ["lat" , "lon" , "seats" , "fullname" , "shortname" ,
     "number" , "name" , "address" , "type" , "furniture" , "href" ];


    public constructor(transObj: any) {
        this.groupKeys = [];
        this.applyKeys = [];
        this.IDstrings = [];

        Object.keys(transObj).forEach((key) => {
            if (! (key === "GROUP" || key === "APPLY")) {
                throw new InsightError("Wrong key in TRANS");
            }
        });

        if (! Object.keys(transObj).includes("GROUP") ) {
            throw new InsightError("missing GROUP");
        }
        if (! Object.keys(transObj).includes("APPLY") ) {
            throw new InsightError("missing APPLY");
        }
        if ( Object.keys(transObj).length !== 2 ) {
            throw new InsightError("Trans should have two keys");
        }

        this.GROUP = transObj["GROUP"];
        this.APPLY = transObj["APPLY"];
    }

    public validate() {
        this.validateGroup();
        this.validateApply();
    }

    private validateGroup() {
        if ((! Array.isArray(this.GROUP)) || (this.GROUP.length === 0) ) {
            throw new InsightError("GROUP must be a non-empty array");
        }
        this.groupKeys = this.groupKeys.concat(this.GROUP);
        // added
        this.GROUP.forEach((keyPair) => {
        let idstring = keyPair.split("_", 2)[0];
        let key = keyPair.split("_", 2)[1];
        this.IDstrings.push(idstring);
        if (idstring === "courses" && (! this.allFields4Courses.includes(key))) {
            throw new InsightError("Invalid keys in group");
        } else if (idstring === "rooms" && (! this.allFields4Rooms.includes(key))) {
            throw new InsightError("Invalid keys in group");
        }
        });
    }

    private validateApply() {
        // apply can be an empty arrary!
        if (! Array.isArray(this.GROUP) ) {
            throw new InsightError("APPLY must be array");
        }
        if (this.APPLY.length === 0) {
            return;
        } else if (this.APPLY.length > 0 ) {
            this.APPLY.forEach((APPLYRULE: any) => {
                if (! APPLYRULE) {
                    { throw new InsightError("APPLYRule empty or null"); }
                }

                if (Object.keys(APPLYRULE).length !== 1) {
                    { throw new InsightError("APPLYRule should only have 1 key"); }
                }

                let applykey: string = Object.keys(APPLYRULE)[0];
                if (applykey.includes("_") || applykey.length === 0) {
                    throw new InsightError("Applykey should not have underscore");
                }
                this.applyKeys.push(applykey);

                // Alleviating APPLYTOKEN: KEY pair to Token pair
                let TokenPair: any = Object.values(APPLYRULE)[0];

                if (Object.keys(TokenPair).length !== 1) {
                    throw new InsightError("APPLYTOKEN pair should only have 1 key");
                }

                if (Object.values(TokenPair).length !== 1) {
                    throw new InsightError("APPLYTOKEN pair should only have 1 value");
                }

                if (! ["MAX", "MIN", "AVG", "COUNT", "SUM"].includes(Object.keys(TokenPair)[0])) {
                    throw new InsightError("Wrong operator key");
                }

                // check type! count can have both, others can only have number

                let keyAfterToken: string = Object.values(TokenPair)[0] as string;
                let idstring = keyAfterToken.split("_", 2)[0];
                this.IDstrings.push(idstring);

            });
            if ((new Set(this.applyKeys)).size !== this.applyKeys.length) {
                throw new InsightError("Duplicate keys in applykeys");
            }

        }
    }
    // keys in apply and gorup should cover all that in columns

    // return dataset result
    public processTransformation(dataObjArrary: any): any {
        let intermediate = this.performGroup(dataObjArrary);
        return this.performApply(intermediate);
        // finally return an object start with {[id+key]:map.key * group#  and other apply rule }
    }


    private performGroup(dataObjArrary: any): any[] {
        const result = [...dataObjArrary.reduce((resultMap: any, obj: any) => {
            let key: any = "";
            this.GROUP.forEach((groupKey: string) => {
                let shrotenKey = groupKey.split("_", 2)[1];
                key = key + obj[shrotenKey];
            });
            const item = resultMap.get(key) || Object.assign({}, obj, {
              data: []
            });

            item["data"].push(obj);

            return resultMap.set(key, item);
          }, new Map()).values()];

        return result;
    }

    private performApply(intermediate: any): any {
        this.APPLY.forEach((rule: Applyrule) => {
            rule = new Applyrule(rule);
            rule.runRule(intermediate);

            // don't really need this, since we gonna filter out the unnecessary fields
            // intermediate.forEach((singleObj: any) => {
            //     delete singleObj["data"];
            // });
        });
        return intermediate;
    }
}
