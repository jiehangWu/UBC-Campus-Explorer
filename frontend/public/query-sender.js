/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = function (query) {
    return new Promise(function (fulfill, reject) {
        let httpRequest = new XMLHttpRequest();
        const url = "http://localhost:4321/query";
        const method = "POST";

        // true is an option to perform this operation asynchrounously
        httpRequest.open(method, url, true);
        httpRequest.setRequestHeader("Content-Type", "application/json");
        httpRequest.onload = () => {
            if (httpRequest.readyState === httpRequest.DONE) {
                if (httpRequest.status === 200) {
                    // OK
                    fulfill(JSON.parse(httpRequest.responseText));
                } else {
                    reject(JSON.parse(httpRequest.responseText));
                }
            }
        };

        httpRequest.send(JSON.stringify(query));
    });
};
