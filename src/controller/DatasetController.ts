import { InsightDatasetKind, InsightError, InsightDataset, NotFoundError } from "./IInsightFacade";
import { JSZipObject } from "jszip";
import * as JSZip from "jszip";
import * as fs from "fs-extra";
import Log from "../Util";
import HtmlController from "./HtmlController";
import IBuilding from "../model/IBuilding";
import IRoom from "../model/IRoom";
import { rejects } from "assert";

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
    private htmlController: HtmlController;

    public constructor() {
        this.datasets = new Map();
        this.htmlController = new HtmlController();
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

    private saveToDisk(id: string, data: any, kind: InsightDatasetKind): void {
        let dir = "./data/" + kind;

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        fs.writeFileSync(dir + "/" + id + ".json", JSON.stringify(data));
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

    // to be refactored
    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<any> {
        return new Promise((resolve, reject) => {


            new JSZip().loadAsync(content, { base64: true })
                .then((zip: JSZip) => {
                    if (zip.folder(kind).length === 0) {
                        reject(new InsightError("Does not contain valid file"));
                    }

                    if (kind === InsightDatasetKind.Courses) {
                        this.addCourseDataset(id, zip, kind)
                            .then((result: any) => {
                                this.datasets.set(id, { id: id, kind: kind, numRows: result });
                                resolve();
                            });
                    }

                    if (kind === InsightDatasetKind.Rooms) {
                        this.addRoomDataset(id, zip, kind)
                            .then((result: any) => {
                                this.datasets.set(id, { id: id, kind: kind, numRows: result });
                                resolve();
                            });
                    }

                })
                .catch((err: any) => {
                    reject(new InsightError("Can not loadAsync"));
                });
        });
    }

    private addCourseDataset(id: string, zip: JSZip, kind: InsightDatasetKind): Promise<any> {
        let promises: Array<Promise<string>> = [];

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
        })

        return Promise.all(promises)
            .then((contents: any[]) => {
                this.parseFileContents(contents)
                    .then((courses: ICourse[]) => {
                        if (courses.length >= 1) {
                            this.saveToDisk(id, courses, kind);
                            // this.datasets.set(id, {id: id, kind: kind, numRows: courses.length});
                            return Promise.resolve(courses.length);
                        } else {
                            Promise.reject(new InsightError("This dataset does not contain a valid section"));
                        }
                    });
            })
            .catch((err: any) => {
                return Promise.reject(new InsightError("Can not Promise.all"));
            });
    }

    // to be refactored
    private addRoomDataset(id: string, zip: JSZip, kind: InsightDatasetKind): Promise<any> {
        return zip.folder(kind).file("index.htm").async("text")
            .then((content: string) => {
                this.htmlController.processBuildingPage(content, zip)
                    .then((rooms: IRoom[][]) => {
                        let roomArr: IRoom[] = [];
                        for (let i = 0; i < rooms.length; i++) {
                            for (let j = 0; j < rooms[i].length; j++) {
                                roomArr.push(rooms[i][j]);
                            }
                        }
                        this.saveToDisk(id, roomArr, kind);
                        // this.datasets.set(id, {id: id, kind: kind, numRows: roomArr.length});
                        Promise.resolve(roomArr.length);
                    })
                    .catch((err: any) => {
                        Log.error(err);
                        Promise.reject(err);
                    });
            })
            .catch((err: any) => {
                Log.error(err);
                Promise.reject(err);
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

