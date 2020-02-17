import IRoom from "../model/IRoom";
import IBuilding from "../model/IBuilding";
import IRoomDetail from "../model/IRoomDetail";
import HttpController from "./HttpController";
import GeoResponse from "../model/GeoResponse";
import * as JSZip from "jszip";
import Log from "../Util";

const parse5 = require("parse5");

export default class HtmlController {
    private httpController: HttpController;

    constructor() {
        this.httpController = new HttpController();
    }

    public processBuildingPage(content: string, zip: JSZip): any {
        const document: any = this.loadContent(content);
        const tbody: any = this.findNode(document, "tbody");

        let promises: Array<Promise<IRoom[]>> = [];

        if (tbody !== null) {
            Array.from(tbody.childNodes).forEach((childNode: any) => {
                if (childNode.tagName === "tr") {
                    const building: IBuilding = this.parseBuilding(childNode);
                    let result: Promise<IRoom[]> = this.processRoomPage(zip, building)
                        .then((rooms: IRoom[]) => {
                            return rooms;
                        })
                        .catch((err: any) => {
                            Log.error(err);
                            return null;
                        });
                    promises.push(result);
                }
            });
        }

        return Promise.all(promises)
            .then((rooms: IRoom[][]) => {
                return Promise.resolve(rooms);
            })
            .catch((err: any) => {
                Log.error(err);
                return Promise.reject(err);
            });
    }

    private processRoomPage(zip: JSZip, building: IBuilding): Promise<IRoom[]> {
        return new Promise((resolve, reject) => {
            zip.file(building.href.replace(".", "rooms")).async("text")
                .then((content: string) => {
                    const document: any = this.loadContent(content);
                    const tbody: any = this.findNode(document, "tbody");

                    if (tbody !== null) {
                        let roomDetails: IRoomDetail[] = [];
                        Array.from(tbody.childNodes).forEach((childNode: any) => {
                            if (childNode.tagName === "tr") {
                                const roomDetail: IRoomDetail = this.parseRoom(childNode);
                                roomDetails.push(roomDetail);
                            }
                        });
                        this.mergeBuildingAndRoomDetail(building, roomDetails)
                            .then((result: IRoom[]) => {
                                resolve(result);
                            })
                            .catch((err: any) => {
                                Log.error(err);
                                reject(err);
                            });
                    } else {
                        resolve([]);
                    }
                })
                .catch((err: any) => {
                    reject(err);
                });
        });
    }

    /**
     *
     * @param building The data from IBuilding
     * @param roomDetail The data from IRoomDetail
     * @return The merged interface of IRoom
     */
    private mergeBuildingAndRoomDetail(building: IBuilding, roomDetails: IRoomDetail[]): Promise<IRoom[]> {
        let rooms: IRoom[] = [];
        return new Promise((resolve, reject) => {
            this.httpController.getGeoResponse(building.address)
                .then((result: GeoResponse) => {
                    if (this.httpController.checkValidityOfGeoResponse(result)) {
                        roomDetails.forEach((roomDetail: IRoomDetail) => {
                            if (roomDetail !== null) {
                                rooms.push({
                                    fullname: building.fullname,
                                    shortname: building.shortname,
                                    number: roomDetail.roomNumber,
                                    name: building.shortname + "_" + roomDetail.roomNumber,
                                    address: building.address,
                                    lat: result.lat,
                                    lon: result.lon,
                                    seats: Number(roomDetail.seats),
                                    type: roomDetail.type,
                                    furniture: roomDetail.furniture,
                                    href: roomDetail.href
                                });
                            }
                        });
                    }

                    resolve(rooms);
                })
                .catch((err: any) => {
                    Log.error(err);
                    reject(err);
                });
        });

    }

    /**
     *
     * @param content
     * return a document to be the parsed html node.
     */
    private loadContent(content: string): any {
        return parse5.parse(content);
    }

    /**
     * Find the target node of root node using depth-first-search
     * @param rootNode
     * @param nodeName The name of the target node
     * @return The searched node. Return null if not found.
     */
    private findNode(rootNode: any, nodeName: string): any {
        const skippedNodeNames: Set<string> = new Set(["#text", "#comment", "noscript", "script"]);
        const stack: any[] = Array.from(rootNode.childNodes)
            .filter((node: string) => {
                if (!skippedNodeNames.has(node)) {
                    return node;
                }
            });

        while (stack.length > 0) {
            const node = stack.pop();

            if (node.nodeName === nodeName) {
                return node;
            }

            if (node.childNodes == null) {
                continue;
            }

            Array.from(node.childNodes).forEach((childNode: any) => {
                if (!skippedNodeNames.has(childNode)) {
                    stack.push(childNode);
                }
            });
        }

        return null;
    }

    /**
     * Parse a row in the table of buildings.
     * @param row The row of table of buildings.
     * @return Parsed results of IBuilding
     */
    private parseBuilding(row: any): IBuilding {
        let code: string, address: string, href: string, title: string;

        Array.from(row.childNodes).forEach((childNode: any) => {
            if (childNode.tagName === "td") {
                if (childNode.attrs[0].value === "views-field views-field-field-building-code") {
                    code = childNode.childNodes[0].value.trim();
                }

                if (childNode.attrs[0].value === "views-field views-field-title") {
                    let anchorNode = this.findNode(childNode, "a");
                    title = anchorNode.childNodes[0].value.trim();
                }

                if (childNode.attrs[0].value === "views-field views-field-field-building-address") {
                    address = childNode.childNodes[0].value.trim();
                }

                if (childNode.attrs[0].value === "views-field views-field-nothing") {
                    let anchorNode = this.findNode(childNode, "a");
                    href = anchorNode.attrs[0].value;
                }
            }
        });
        if (code !== undefined && address !== undefined && href !== undefined && title !== undefined) {
            return { fullname: title, shortname: code, address: address, href: href };
        }
        return null;
    }

    /**
     *
     * @param row
     * @return Parsed results of IRoomDetail
     */
    private parseRoom(row: any): IRoomDetail {
        let roomNumber: string, capacity: number,
            furniture: string, type: string, href: string;

        Array.from(row.childNodes).forEach((childNode: any) => {
            if (childNode.tagName === "td") {
                if (childNode.attrs[0].value === "views-field views-field-field-room-number") {
                    let anchorNode = this.findNode(childNode, "a");
                    roomNumber = anchorNode.childNodes[0].value.trim();
                }

                if (childNode.attrs[0].value === "views-field views-field-field-room-capacity") {
                    capacity = childNode.childNodes[0].value.trim();
                }

                if (childNode.attrs[0].value === "views-field views-field-field-room-furniture") {
                    furniture = childNode.childNodes[0].value.trim();
                }

                if (childNode.attrs[0].value === "views-field views-field-field-room-type") {
                    type = childNode.childNodes[0].value.trim();
                }

                if (childNode.attrs[0].value === "views-field views-field-nothing") {
                    let anchorNode = this.findNode(childNode, "a");
                    href = anchorNode.attrs[0].value;
                }
            }
        });

        if (roomNumber !== undefined && capacity !== undefined
            && furniture !== undefined && type !== undefined && href !== undefined) {
            return { roomNumber: roomNumber, seats: capacity, type: type, furniture: furniture, href: href };
        }
        return null;
    }

}
