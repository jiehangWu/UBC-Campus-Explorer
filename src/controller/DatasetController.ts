import { InsightDatasetKind, InsightError, InsightDataset, NotFoundError } from "./IInsightFacade";
import { JSZipObject } from "jszip";
import * as JSZip from "jszip";

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
                let year;
                if (section["Year"] === "overall") {
                    year = 1900;
                } else {
                    year = section["Year"];
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
            && ("id" in section) && ("Year" in section);
    }

    private saveToDisk(id: string, courses: ICourse[]): void {
        let fs = require("fs");
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
            let jszip = new JSZip();

            jszip.loadAsync(content, {base64: true})
                .then((zip) => {
                // Load file to an array of promises
                let promises: Array<Promise<string>> = [];

                zip.folder(id).forEach((_, file: JSZipObject) => {
                    let fileContent = file.async("text")
                        .then((body: string) => {
                            return JSON.parse(body);
                        })
                        .catch((err: any) => {
                            return null;
                        });
                    promises.push(fileContent);
                });

                Promise.all(promises)
                .then((fileContents: any[]) => {
                    this.parseFileContents(fileContents)
                    .then((courses: ICourse[]) => {
                        if (courses.length >= 1) {
                            this.saveToDisk(id, courses);
                            resolve([id, courses.length]);
                        } else {
                            reject(new InsightError("This dataset does not contain a valid section"));
                        }
                    })
                    .catch((err: any) => {
                        reject(new InsightError("This dataset does not contain a valid file"));
                    });
                })
                .catch((err: any) => {
                    reject(err);
                });
            })
            .catch((err: any) => {
                reject(new InsightError("This file is not valid zip file"));
            });
        });
    }

    public removeDataset(id: string): Promise<string> {
        if (!this.validateId(id)) {
            return Promise.reject(new InsightError("This id is invalid"));
        }

        let path = "./data/" + "courses";
        let fs = require("fs-extra");

        if (this.datasets.has(id) || fs.existsSync(path)
        || fs.existsSync(path + "/" + id + ".json")) {

            fs.unlinkSync(path + "/" + id + ".json");

            this.datasets.delete(id);

            return Promise.resolve(id);
        } else {
            return Promise.reject(new NotFoundError("ID is not in the dataset"));
        }
    }
}

