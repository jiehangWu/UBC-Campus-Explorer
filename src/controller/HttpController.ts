import GeoResponse from "../model/GeoResponse";
import Log from "../Util";
const http = require("http");

export default class HttpController {
    private static teamNumber: string = "003";
    private static URL = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team";

    /**
     *
     * @param address
     * @return Promise<GeoResponse>
     */
    public getGeoResponse(address: string): Promise<GeoResponse> {
        address = encodeURI(address);
        const url = HttpController.URL + HttpController.teamNumber + "/" + address;
        return this.request(url);
    }

    public checkValidityOfGeoResponse(result: GeoResponse) {
        return result !== null && result !== "undefined" && "lat" in result && "lon" in result;
    }

    /**
     *
     * @param url
     * @return The GeoResponse if resolved, otherwise reject with error
     */
    private request(url: string): Promise<GeoResponse> {
        return new Promise((resolve, reject) => {
            http.get(url, (response: any) => {
                let data: string = "";

                response.on("data", (chunk: any) => {
                    data += chunk;
                });

                response.on("end", () => {
                    const body: GeoResponse = JSON.parse(data);
                    resolve(body);
                });
            })
            .on("error", (err: any) => {
                Log.error(err);
                resolve();
            });
        });
    }

}
