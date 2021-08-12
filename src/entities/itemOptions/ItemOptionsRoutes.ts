import ItemOptionsController from "./ItemOptionsController";
import ValidationMiddleware from "../../general/middleware/ValidationMiddleware";
import AuthMiddleware from "../../general/middleware/AuthMiddleware";
import ItemOptionsJoiSchema from "./ItemOptionsJoiSchema";
import GeneralJoiSchema from "../../general/JoiSchemas/GeneralJoiSchema";

export default class ItemOptionsRoutes{
constructor(app, itemOptionsController: ItemOptionsController, validationMiddleware: ValidationMiddleware, authMiddleware: AuthMiddleware, itemOptionsSchema: ItemOptionsJoiSchema, generalSchema: GeneralJoiSchema){
     app.post("/item/options/create",
     authMiddleware.strict,
     validationMiddleware.validateBody( itemOptionsSchema.create),
     itemOptionsController.create.bind(itemOptionsController));

     app.post("/item/options/update",
     authMiddleware.strict,
     validationMiddleware.validateBody( itemOptionsSchema.update),
     itemOptionsController.update.bind(itemOptionsController));

     app.get("/item/options/fetchByCurrent",
    authMiddleware.optional,
    validationMiddleware.validateQuery(
        generalSchema.orderByFilterLimit,
        generalSchema.populateFields
        ),
    itemOptionsController.fetchByCurrent.bind(itemOptionsController)); // owner-version of fetch by id - exposes potentially private info to owner only

    app.get("/item/options/fetch/:id",
    authMiddleware.optional,
    validationMiddleware.validateParams(generalSchema.fetchById),
    validationMiddleware.validateQuery(generalSchema.populateFields),
    itemOptionsController.fetchById.bind(itemOptionsController)); // owner-version of fetch by id - exposes potentially private info to owner only

    app.delete("/item/options/delete/:id",
    authMiddleware.strict,
    validationMiddleware.validateParams( generalSchema.fetchById),
    itemOptionsController.deleteById.bind(itemOptionsController));
}
}