import LogController from "../controllers/LogController";

export default class LogRoutes {

    constructor(app, logController: LogController) {
        app.get("/logs/bree52637tee09wa",
        logController.getLogs.bind(logController));
    }
}