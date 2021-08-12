import ValidationMiddleware from "../../general/middleware/ValidationMiddleware";
import AuthMiddleware from "../../general/middleware/AuthMiddleware";
import GeneralJoiSchema from "../../general/JoiSchemas/GeneralJoiSchema";
import DeliveryEventJoiSchema from "./DeliveryEventJoiSchema";
import DeliveryEventController from "./DeliveryEventController";

export default class DeliveryEventRoutes {
  constructor(app, deliveryEventController: DeliveryEventController, validationMiddleware: ValidationMiddleware, authMiddleware: AuthMiddleware, deliveryEventSchema: DeliveryEventJoiSchema, generalSchema: GeneralJoiSchema) {
    app.post("/deliveryEvent/create",
      authMiddleware.admin,
      validationMiddleware.validateBody(deliveryEventSchema.create),
      deliveryEventController.create.bind(deliveryEventController));

    app.get("/deliveryEvent/fetch/:id",
      authMiddleware.optional,
      validationMiddleware.validateParams(generalSchema.fetchById),
      validationMiddleware.validateQuery(generalSchema.populateFields),
      deliveryEventController.fetchById.bind(deliveryEventController)); // owner-version of fetch by id - exposes potentially private info to owner only


    app.get("/deliveryEvent/fetchMultiple",
      authMiddleware.optional,
      validationMiddleware.validateQuery(
        generalSchema.orderByFilterLimit,
        generalSchema.olderThan,
        generalSchema.newerThan,
        generalSchema.search,
        generalSchema.populateFields,
        deliveryEventSchema.fetchMultiple
      ),
      deliveryEventController.fetchMultiple.bind(deliveryEventController)); // owner-version of fetch by id - exposes potentially private info to owner only

    app.post("/deliveryEvent/update",
      authMiddleware.admin,
      validationMiddleware.validateBody(deliveryEventSchema.update),
      deliveryEventController.update.bind(deliveryEventController));

    app.delete("/deliveryEvent/delete/:id",
      authMiddleware.admin,
      validationMiddleware.validateParams(generalSchema.fetchById),
      deliveryEventController.deleteById.bind(deliveryEventController));
  }
}