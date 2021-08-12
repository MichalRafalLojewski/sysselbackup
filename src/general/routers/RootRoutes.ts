import RootController from "../controllers/RootController";

export default class RootRoutes {

    constructor(app, rootController: RootController) {
        app.get("/",
        rootController.root.bind(rootController));
    }
}