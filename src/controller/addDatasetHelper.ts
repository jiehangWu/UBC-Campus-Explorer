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

function parseFileContent(fileContent: any, courses: ICourse[]): void {
    // check if each json file is valid
    if (fileContent !== null && fileContent.result !== null && ("result" in fileContent)) {
        let result = fileContent["result"];
        for (let section of result) {
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
}

function saveToDisk(id: string, courses: ICourse[]): void {
    let fs = require("fs");
    fs.writeFile("./data/" + id + ".json", JSON.stringify(courses), (err: any) => {
        return Log.error(err);
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
                let courses: ICourse[] = [];
                for (let fileContent of fileContents) {
                    parseFileContent(fileContent, courses);
                }

                saveToDisk(id, courses);
                return resolve(id);
            })
            .catch((err: any) => {
                return reject(err);
            });
        })
        .catch((err: any) => {
            return reject(new InsightError("This file is not valid zip file"));
        });
    });
}
