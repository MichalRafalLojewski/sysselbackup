import MissionController from "./MissionController";
import ValidationMiddleware from "../../general/middleware/ValidationMiddleware";
import AuthMiddleware from "../../general/middleware/AuthMiddleware";
import MissionJoiSchema from "./MissionJoiSchema";
import GeneralJoiSchema from "../../general/JoiSchemas/GeneralJoiSchema";

export default class MissionRoutes{
constructor(app, missionController: MissionController, validationMiddleware: ValidationMiddleware, authMiddleware: AuthMiddleware, missionSchema: MissionJoiSchema, generalSchema: GeneralJoiSchema){
  
  app.post("/mission/create",
  authMiddleware.strict,
  validationMiddleware.validateBody(missionSchema.create),
  missionController.create.bind(missionController));
 
  app.get("/mission/fetch/:id",
  authMiddleware.optional,
  validationMiddleware.validateParams(generalSchema.fetchById),
    validationMiddleware.validateQuery(generalSchema.populateFields),
  missionController.fetchById.bind(missionController));
 
  app.get("/mission/fetchAny", // middleware:
  authMiddleware.optional,
  validationMiddleware.validateQuery( // schemas:
    generalSchema.orderByFilterLimit,
    generalSchema.category,
    generalSchema.search,
    generalSchema.newerThan,
    generalSchema.olderThan,
    generalSchema.populateFields,
    generalSchema.filterByOwner,
    generalSchema.filterByLocation
  ),// controller function:
  missionController.fetchAny.bind(missionController));
 
  app.get("/mission/fetchByProfile", // middleware:
  authMiddleware.optional,
  validationMiddleware.validateQuery( // schemas:
    generalSchema.orderByFilterLimit,
    generalSchema.fetchByProfile,
    generalSchema.category,
    generalSchema.search,
    generalSchema.newerThan,
    generalSchema.olderThan,
    generalSchema.populateFields,
    generalSchema.filterByOwner,
    generalSchema.filterByLocation
  ),// controller function:
  missionController.fetchByProfile.bind(missionController));
 
  app.delete("/mission/delete/:id",
  authMiddleware.strict,
  validationMiddleware.validateParams(generalSchema.fetchById),
  missionController.delete.bind(missionController));
 
  app.post("/mission/update",
  authMiddleware.strict,
  validationMiddleware.validateBody(
  missionSchema.update
  ),
  missionController.update.bind(missionController));

  app.get("/mission/fromSubscriptions", // middleware:
  authMiddleware.strict,
  validationMiddleware.validateQuery( // schemas:
      generalSchema.orderByFilterLimit,
      generalSchema.category,
      generalSchema.search,
      generalSchema.newerThan,
      generalSchema.olderThan,
      generalSchema.filterByOwner,
      generalSchema.populateFields,
      generalSchema.filterByLocation
  ),// controller function:
  missionController.fetchSubscriptionMissions.bind(missionController));
}
}