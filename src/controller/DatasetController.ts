import { InsightDatasetKind, InsightError, InsightDataset, NotFoundError } from "./IInsightFacade";
import { JSZipObject } from "jszip";
import * as JSZip from "jszip";
import * as fs from "fs-extra";
import Log from "../Util";
import HtmlController from "./HtmlController";
import IRoom from "../model/IRoom";
import ICourse from "../model/ICourse";

export class DatasetController {
    public datasets: Map<string, InsightDataset>;
    private htmlController: HtmlController;

    public constructor() {
        this.datasets = new Map();
        let courseFolder: string = "./data/courses";
        let roomFolder: string = "./data/rooms";

        if (fs.existsSync(courseFolder)) {
            fs.readdirSync(courseFolder).forEach((fileName: string) => {
                this.datasets.set(fileName, {
                    id: fileName,
                    kind: InsightDatasetKind.Courses,
                    numRows: fs.readFileSync(courseFolder + "/" + fileName).length
                });
            });
        }

        if (fs.existsSync(roomFolder)) {
            fs.readdirSync(roomFolder).forEach((fileName: string) => {
                this.datasets.set(fileName, {
                    id: fileName,
                    kind: InsightDatasetKind.Rooms,
                    numRows: fs.readFileSync(roomFolder + "/" + fileName).length
                });
            });
        }

        this.htmlController = new HtmlController();
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

    public removeDataset(id: string): Promise<string> {
        if (!this.validateId(id)) {
            return Promise.reject(new InsightError("This id is invalid"));
        }

        let path = "./data/" + id + "/" + id + ".json";

        if (fs.existsSync(path) && this.datasets.has(id)) {
            fs.unlinkSync(path);

            this.datasets.delete(id);

            return Promise.resolve(id);
        } else {
            return Promise.reject(new NotFoundError("ID is not in the dataset"));
        }
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
                            .then((result: [string, number]) => {
                                this.datasets.set(id, { id: result[0], kind: kind, numRows: result[1] });
                                resolve();
                            });
                    }

                    if (kind === InsightDatasetKind.Rooms) {
                        this.addRoomDataset(id, zip, kind)
                            .then((result: [string, number]) => {
                                this.datasets.set(id, { id: result[0], kind: kind, numRows: result[1] });
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
        return new Promise((resolve, reject) => {
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

            return Promise.all(promises)
                .then((contents: any[]) => {
                    this.parseFileContents(contents)
                        .then((courses: ICourse[]) => {
                            if (courses.length >= 1) {
                                this.saveToDisk(id, courses, kind);
                                resolve(courses.length);
                            } else {
                                reject(new InsightError("This dataset does not contain a valid section"));
                            }
                        });
                })
                .catch((err: any) => {
                    return Promise.reject(new InsightError("Can not Promise.all"));
                });
        });
    }

    // to be refactored
    private addRoomDataset(id: string, zip: JSZip, kind: InsightDatasetKind): Promise<[string, number]> {
        return new Promise((resolve, reject) => {
            zip.folder(kind).file("index.htm").async("text")
                .then((content: string) => {
                    this.htmlController.processBuildingPage(content, zip)
                        .then((rooms: IRoom[][]) => {
                            let roomArr: IRoom[] = [];
                            for (let row of rooms) {
                                for (let element of row) {
                                    roomArr.push(element);
                                }
                            }
                            this.saveToDisk(id, roomArr, kind);
                            resolve([id, roomArr.length]);
                        })
                        .catch((err: any) => {
                            Log.error(err);
                            reject(err);
                        });
                })
                .catch((err: any) => {
                    Log.error(err);
                    reject(err);
                });
        });
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

