import ProfileReviewController from "./ProfileReviewController";
import ValidationMiddleware from "../../general/middleware/ValidationMiddleware";
import AuthMiddleware from "../../general/middleware/AuthMiddleware";
import ItemReviewJoiSchema from "./ProfileReviewJoiSchema";
import GeneralJoiSchema from "../../general/JoiSchemas/GeneralJoiSchema";

export default class ProfileReviewRoutes {
   constructor(app, profileReviewController: ProfileReviewController, validationMiddleware: ValidationMiddleware, authMiddleware: AuthMiddleware, itemReviewSchema: ItemReviewJoiSchema, generalSchema: GeneralJoiSchema) {

      app.post("/profile/review/create",
         authMiddleware.strict,
         validationMiddleware.validateBody(itemReviewSchema.create),
         profileReviewController.create.bind(profileReviewController));

      app.get("/profile/review/fetchFrom/:owner_profile", // middleware:
         authMiddleware.optional,
         validationMiddleware.validateParams(generalSchema.fetchByProfile),
         validationMiddleware.validateQuery( // schemas:
            generalSchema.orderByFilterLimit,
            generalSchema.populateFields,
            generalSchema.filterByOwner
         ),// controller function:
         profileReviewController.fetchFrom.bind(profileReviewController));

      app.get("/profile/review/fetchTo/:id", // middleware:
         authMiddleware.optional,
         validationMiddleware.validateParams(generalSchema.fetchById),
         validationMiddleware.validateQuery( // schemas:
            generalSchema.orderByFilterLimit,
            generalSchema.populateFields,
            generalSchema.filterByOwner
         ),// controller function:
         profileReviewController.fetchTo.bind(profileReviewController));

      app.delete("/profile/review/delete/:id",
         authMiddleware.strict,
         validationMiddleware.validateParams(generalSchema.fetchById),
         profileReviewController.deleteById.bind(profileReviewController));

      app.get("/profile/review/fetch/:id",
         authMiddleware.optional,
         validationMiddleware.validateParams(generalSchema.fetchById),
         validationMiddleware.validateQuery(generalSchema.populateFields),
         profileReviewController.fetchById.bind(profileReviewController)); // owner-version of fetch by id - exposes potentially private info to owner only

   }
}