import { InsightDatasetKind, InsightError, InsightDataset, NotFoundError } from "./IInsightFacade";
import { JSZipObject } from "jszip";
import * as JSZip from "jszip";
import * as fs from "fs-extra";
import Log from "../Util";

interface ICourse {
    dept: string;
    id: string;
    avg: number;
    instructor: string;
    title: string;
    pass: number;
    fail: number;
    audit: number;
    uuid: string;
    year: number;
}

export class DatasetController {
    public datasets: Map<string, InsightDataset>;

    public constructor() {
        this.datasets = new Map();
    }

    private parseFileContents(fileContents: any[]): Promise<ICourse[]> {
        let courses: ICourse[] = [];
        for (let fileContent of fileContents) {
            if (fileContent === null || fileContent["result"].length === 0 || !("result" in fileContent)) {
                continue;
            }

            let result = fileContent["result"];

            for (let section of result) {
                if (!this.validateSection(section)) {
                    continue;
                }
                let year: number;
                if (section["Section"] === "overall") {
                    year = 1900;
                } else {
                    year = Number(section["Year"]);
                }
                courses.push({
                    dept: section["Subject"],
                    id: section["Course"],
                    avg: section["Avg"],
                    instructor: section["Professor"],
                    title: section["Title"],
                    pass: section["Pass"],
                    fail: section["Fail"],
                    audit: section["Audit"],
                    uuid: section["id"].toString(10),
                    year: year,
                });
            }
        }
        return Promise.resolve(courses);
    }

    private validateSection(section: any): boolean {
        // check if every field exists in the course section
        return ("Subject" in section) && ("Course" in section)
            && ("Avg" in section) && ("Professor" in section)
            && ("Title" in section) && ("Pass" in section)
            && ("Fail" in section) && ("Audit" in section)
            && ("id" in section) && ("Year" in section)
            && ("Section" in section);
    }

    private saveToDisk(id: string, courses: ICourse[]): void {
        let dir = "./data/" + "courses";

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        fs.writeFileSync(dir + "/" + id + ".json", JSON.stringify(courses));
    }

    public validateId(id: string): boolean {
        // check if id is null or undefined
        if (typeof id === "undefined" || id === null) {
            return false;
        }
        // "_" should not be included in id
        if (id.includes("_")) {
            return false;
        }
        // check if a string contains only whitespaces
        if (id.trim() === "" || id === "") {
            return false;
        }

        return true;
    }

    public addCourseDataset(id: string, content: string, kind: InsightDatasetKind): Promise<[string, number]> {
        return new Promise((resolve, reject) => {
            let promises: Array<Promise<string>> = [];

            new JSZip().loadAsync(content, { base64: true })
                .then((zip: JSZip) => {
                    if (zip.folder(kind).length === 0) { reject(new InsightError("Does not contain valid file")); }

                    zip.folder(kind).forEach((_, file: JSZipObject) => {
                        let fileContents: Promise<string> = file.async("text")
                            .then((body: string) => {
                                return this.parseJson(body);
                            })
                            .catch((err: any) => {
                                Log.error(err);
                                return null;
                            });

                        promises.push(fileContents);
                    });

                    Promise.all(promises)
                        .then((contents: any[]) => {
                            this.parseFileContents(contents)
                                .then((courses: ICourse[]) => {
                                    if (courses.length >= 1) {
                                        this.saveToDisk(id, courses);
                                        resolve([id, courses.length]);
                                    } else {
                                        reject(new InsightError("This dataset does not contain a valid section"));
                                    }
                                });
                        })
                        .catch((err: any) => {
                            reject(new InsightError("Can not Promise.all"));
                        });
                })
                .catch((err: any) => {
                    reject(new InsightError("can not loadAsync"));
                });
        });
    }

    private parseJson(body: string): string {
        let parsed;
        try {
            parsed = JSON.parse(body);
        } catch (err) {
            parsed = null;
        }
        return parsed;
    }
}

