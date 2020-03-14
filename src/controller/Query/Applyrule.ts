import { Decimal } from "decimal.js";
import { InsightError } from "../IInsightFacade";

export class Applyrule {
    public applykey: string;
    public TokenPair: any;

    private ApplyToken: string;
    private KeyinToken: string;

    private allFields4Courses: string[] = ["avg" , "pass" , "fail" , "audit" , "year",
    "dept" , "id" , "instructor" , "title" , "uuid"];

    private allFields4Rooms: string[] = ["lat" , "lon" , "seats" , "fullname" , "shortname" ,
     "number" , "name" , "address" , "type" , "furniture" , "href" ];

    constructor(ruleObj: any) {
        this.applykey = Object.keys(ruleObj)[0];
        this.TokenPair = Object.values(ruleObj)[0];

        this.ApplyToken = Object.keys(this.TokenPair)[0];
        let idKeyString = Object.values(this.TokenPair)[0] as string;
        let id = idKeyString.split("_", 2)[0];
        this.KeyinToken = idKeyString.split("_", 2)[1];
        if (id === "rooms") {
            if (! this.allFields4Rooms.includes(this.KeyinToken)) {
                throw new InsightError("Invalid key rooms_xxx in ApplyRule");
            }
            if (this.ApplyToken !== "COUNT") {
                if (! ["lat", "lon", "seats" ].includes(this.KeyinToken)) {
                    throw new InsightError("Wrong key type rooms_xxx in ApplyRule");
                }
            }
        }  else if (id === "courses") {
            if (! this.allFields4Courses.includes(this.KeyinToken)) {
                throw new InsightError("Invalid key courses_xxx in ApplyRule");
            }
            if (this.ApplyToken !== "COUNT") {
                if (! ["avg" , "pass" , "fail" , "audit" , "year"].includes(this.KeyinToken)) {
                    throw new InsightError("Wrong key type coursess_xxx in ApplyRule");
                }
            }
        }
    }

    // intermediate array
// [ { key1: 'a', key2: 'c', key3: 123, data: [ [Object], [Object]] },
//   { key1: 'a', key2: 'b', key3: 1234, data: [ [Object] ] },
//   { key1: 'b', key2: 'b', key3: 1234, data: [ [Object], [Object] ] } ]
//  above is the example of array after grouping
    public runRule(intermediateArrary: any) {
        intermediateArrary.forEach((singleGroupObj: any) => {
            let intermediateData = singleGroupObj.data as any[];
            let res = intermediateData[0][this.KeyinToken];

            if (this.ApplyToken === "MAX") {
                intermediateData.forEach((dataObj: any) => {
                    res = Math.max(res, dataObj[this.KeyinToken]);
                });

            } else if (this.ApplyToken === "MIN") {
                intermediateData.forEach((dataObj: any) => {
                    res = Math.min(res, dataObj[this.KeyinToken]);
                });

            } else if (this.ApplyToken === "AVG") {
                let sum = new Decimal(0);
                let count = 0;
                intermediateData.forEach((dataObj: any) => {
                    let n1: number = dataObj[this.KeyinToken];
                    let toAdd: Decimal = new Decimal(n1);
                    sum = sum.add(toAdd);
                    count++;
                });
                let avg = sum.toNumber() / count;
                res = Number(avg.toFixed(2));

            } else if (this.ApplyToken === "SUM") {
                let sum = new Decimal(0);
                intermediateData.forEach((dataObj: any) => {
                    sum = sum.add(new Decimal(dataObj[this.KeyinToken]));
                });
                res = sum.toNumber();
                res = Number(res.toFixed(2));

            } else if (this.ApplyToken === "COUNT") {
                let countset = new Set();
                intermediateData.forEach((dataObj: any) => {
                    countset = countset.add(dataObj[this.KeyinToken]);
                });
                res = countset.size;
            }
            singleGroupObj[this.applykey] = res;
        });
    }
}
