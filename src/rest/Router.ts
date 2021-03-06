import InsightFacade from "../controller/InsightFacade";
import restify = require("restify");
import { InsightDatasetKind, InsightError, NotFoundError, InsightDataset } from "../controller/IInsightFacade";
import Log from "../Util";

export default class Router {
    private insightFacade: InsightFacade;

    constructor() {
        this.insightFacade = new InsightFacade();
    }

    public put(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("Router::put(..) - params: " + JSON.stringify(req.params));

        const id: string = req.params.id;
        const kind: InsightDatasetKind = req.params.kind;
        let content: Buffer = Buffer.from(req.body);
        let base64Content: string = content.toString("base64");

        this.insightFacade.addDataset(id, base64Content, kind)
        .then((response: string[]) => {
            Log.info("Router::put(..) - responding " + 200);
            res.json(200, {result: response});
            return next();
        })
        .catch((err: any) => {
            Log.error("Router::put(..) - responding 400");
            res.json(400, {error: err.toString()});
            return next();
        });
    }

    public delete(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("Router::delete(..) - params: " + JSON.stringify(req.params));

        const id: string = req.params.id;

        this.insightFacade.removeDataset(id)
        .then((response: string) => {
            Log.info("Router::delete(..) - responding " + 200);
            res.json(200, {result: response});
            return next();
        })
        .catch((err: any) => {
            if (err instanceof InsightError) {
                Log.error("Router::delete(..) - responding 400");
                res.json(400, {error: err.toString()});
            } else if (err instanceof NotFoundError) {
                Log.error("Router::delete(..) - responding 404");
                res.json(404, {error: err.toString()});
            }

            return next();
        });
    }

    public post(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("Router::post(..) - params: " + JSON.stringify(req.params));

        const query = req.body;
        this.insightFacade.performQuery(query)
        .then((response: any[]) => {
            Log.info("Router::post(..) - responding " + 200);
            res.json(200, {result: response});
            return next();
        })
        .catch((err: any) => {
            Log.error("Router::post(..) - responding 400");
            res.json(400, {error: err.toString()});
            return next();
        });
    }

    public getList(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("Router::getList(..) - params: " + JSON.stringify(req.params));

        this.insightFacade.listDatasets()
        .then((response: InsightDataset[]) => {
            Log.info("Router::getList(..) - responding " + 200);
            res.json(200, {result: response});
            return next();
        })
        .catch((err: any) => {
            Log.error("Router::getList(..) - Should never reject");
            return next();
        });
    }
}
