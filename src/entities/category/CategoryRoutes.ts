import CategoryController from "./CategoryController";
import ValidationMiddleware from "../../general/middleware/ValidationMiddleware";
import AuthMiddleware from "../../general/middleware/AuthMiddleware";
import GeneralJoiSchema from "../../general/JoiSchemas/GeneralJoiSchema";
import CategoryJoiSchema from "./CategoryJoiSchema";

export default class CampaignRoutes {
    constructor(app, categoryController: CategoryController, validationMiddleware: ValidationMiddleware, authMiddleware: AuthMiddleware, generalSchema: GeneralJoiSchema, categorySchema: CategoryJoiSchema) {

        app.get("/category/fetchMultiple", // middleware:
            authMiddleware.optional,
            validationMiddleware.validateQuery( // schemas:
                generalSchema.orderByFilterLimit,
                generalSchema.populateFields
            ),// controller function:
            categoryController.fetchMultiple.bind(categoryController));

        app.post("/category/create", // middleware:
            authMiddleware.admin,
            validationMiddleware.validateBody( // schemas:
                categorySchema.create
            ),// controller function:
            categoryController.create.bind(categoryController));


        app.post("/category/update", // middleware:
            authMiddleware.admin,
            validationMiddleware.validateBody( // schemas:
                categorySchema.update
            ),// controller function:
            categoryController.update.bind(categoryController));

        app.get("/category/fetch/:id", // middleware:
            authMiddleware.optional,
            validationMiddleware.validateParams( // schemas:
                generalSchema.fetchById
            ),// controller function:
            categoryController.fetchById.bind(categoryController));

        app.delete("/category/delete/:id", // middleware:
            authMiddleware.admin,
            validationMiddleware.validateParams( // schemas:
                generalSchema.fetchById
            ),// controller function:
            categoryController.delete.bind(categoryController));
    }
}