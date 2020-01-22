import { InsightDatasetKind, InsightError } from "./IInsightFacade";
import { JSZipObject } from "jszip";
import * as JSZip from "jszip";
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

function parseFileContents(fileContents: any[]): Promise<ICourse[]> {
    let courses: ICourse[] = [];
    for (let fileContent of fileContents) {
        if (fileContent === null || fileContent["result"] === null || !("result" in fileContent)) {
            continue;
        }

        let result = fileContent["result"];

        for (let section of result) {
            if (!validateSection) {
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
                uuid: section["id"],
                year: year,
            });
        }
    }
    return Promise.resolve(courses);
}

function validateSection(section: any): boolean {
    // check if every field exists in the course section
    return ("Subject" in section) && ("Course" in section)
        && ("Avg" in section) && ("Professor" in section)
        && ("Title" in section) && ("Pass" in section)
        && ("Fail" in section) && ("Audit" in section)
        && ("id" in section) && ("Year" in section);
}

function saveToDisk(id: string, courses: ICourse[]): void {
    let fs = require("fs");

    fs.writeFileSync("./data/" + id + ".json", JSON.stringify(courses), (err: any) => {
        Log.error(err);
    });
}

export function addCourseDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string> {
    return new Promise((resolve, reject) => {
        let jszip = new JSZip();

        jszip.loadAsync(content, {base64: true})
            .then((zip) => {
            // Load file to an array of promises
            let promises: Array<Promise<string>> = [];

            zip.folder(kind).forEach((_, file: JSZipObject) => {
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
                return parseFileContents(fileContents)
                .then((courses: ICourse[]) => {
                    if (courses.length >= 1) {
                        saveToDisk(id, courses);
                        resolve(id);
                    } else {
                        reject("This dataset does not contain a valid section");
                    }
                })
                .catch((err: any) => {
                    reject("This dataset does not contain a valid section");
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
