import ItemReviewController from "./ItemReviewController";
import ValidationMiddleware from "../../general/middleware/ValidationMiddleware";
import AuthMiddleware from "../../general/middleware/AuthMiddleware";
import ItemReviewJoiSchema from "./ItemReviewJoiSchema";
import GeneralJoiSchema from "../../general/JoiSchemas/GeneralJoiSchema";

export default class ItemReviewRoutes{
constructor(app, itemReviewController: ItemReviewController, validationMiddleware: ValidationMiddleware, authMiddleware: AuthMiddleware, itemReviewSchema: ItemReviewJoiSchema, generalSchema: GeneralJoiSchema){
 app.post("/item/review/create",
 authMiddleware.strict,
 validationMiddleware.validateBody(itemReviewSchema.create),
 itemReviewController.create.bind(itemReviewController));

 app.get("/item/review/fetchByProfile", // middleware:
 authMiddleware.optional,
  validationMiddleware.validateQuery( // schemas:
     generalSchema.fetchByProfile,
     generalSchema.orderByFilterLimit,
     generalSchema.populateFields,
     generalSchema.filterByOwner
  ),// controller function:
  itemReviewController.fetchByProfile.bind(itemReviewController));

  app.get("/item/review/fetchByItem", // middleware:
  authMiddleware.optional,
  validationMiddleware.validateQuery( // schemas:
     generalSchema.fetchById,
     generalSchema.olderThan,
     generalSchema.filterByOwner,
     generalSchema.newerThan,
     generalSchema.orderByFilterLimit,
     generalSchema.populateFields
   ),// controller function:
   itemReviewController.fetchByItem.bind(itemReviewController));

   app.delete("/item/review/delete/:id",
   authMiddleware.strict,
   validationMiddleware.validateParams( generalSchema.fetchById),
   itemReviewController.deleteById.bind(itemReviewController));

   app.get("/item/review/fetch/:id",
   authMiddleware.optional,
   validationMiddleware.validateParams(generalSchema.fetchById),
   validationMiddleware.validateQuery(generalSchema.populateFields),
   itemReviewController.fetchById.bind(itemReviewController)); // owner-version of fetch by id - exposes potentially private info to owner only

}
}