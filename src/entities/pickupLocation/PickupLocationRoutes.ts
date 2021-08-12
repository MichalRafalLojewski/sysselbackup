import ValidationMiddleware from "../../general/middleware/ValidationMiddleware";
import AuthMiddleware from "../../general/middleware/AuthMiddleware";
import GeneralJoiSchema from "../../general/JoiSchemas/GeneralJoiSchema";
import PickupLocationJoiSchema from "./PickupLocationJoiSchema";
import PickupLocationController from "./PickupLocationController";

export default class PickupLocationRoutes {
  constructor(app, pickupLocationController: PickupLocationController, validationMiddleware: ValidationMiddleware, authMiddleware: AuthMiddleware, pickupLocationSchema: PickupLocationJoiSchema, generalSchema: GeneralJoiSchema) {
    app.post("/pickupLocation/create",
      authMiddleware.admin,
      validationMiddleware.validateBody(pickupLocationSchema.create),
      pickupLocationController.create.bind(pickupLocationController));

    app.get("/pickupLocation/fetch/:id",
      authMiddleware.optional,
      validationMiddleware.validateParams(generalSchema.fetchById),
      validationMiddleware.validateQuery(generalSchema.populateFields),
      pickupLocationController.fetchById.bind(pickupLocationController)); // owner-version of fetch by id - exposes potentially private info to owner only


    app.get("/pickupLocation/fetchMultiple",
      authMiddleware.optional,
      validationMiddleware.validateQuery(
        generalSchema.orderByFilterLimit,
        generalSchema.olderThan,
        generalSchema.newerThan,
        generalSchema.search,
        generalSchema.populateFields,
      ),
      pickupLocationController.fetchMultiple.bind(pickupLocationController)); // owner-version of fetch by id - exposes potentially private info to owner only


    app.post("/pickupLocation/update",
      authMiddleware.admin,
      validationMiddleware.validateBody(pickupLocationSchema.update),
      pickupLocationController.update.bind(pickupLocationController));

    app.delete("/pickupLocation/delete/:id",
      authMiddleware.admin,
      validationMiddleware.validateParams(generalSchema.fetchById),
      pickupLocationController.deleteById.bind(pickupLocationController));
  }
}