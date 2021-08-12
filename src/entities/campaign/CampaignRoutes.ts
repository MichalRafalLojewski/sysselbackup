import CampaignController from "./CampaignController";
import ValidationMiddleware from "../../general/middleware/ValidationMiddleware";
import AuthMiddleware from "../../general/middleware/AuthMiddleware";
import CampaignJoiSchema from "./CampaignJoiSchema";
import GeneralJoiSchema from "../../general/JoiSchemas/GeneralJoiSchema";

export default class CampaignRoutes{
constructor(app, campaignController: CampaignController, validationMiddleware: ValidationMiddleware, authMiddleware: AuthMiddleware, campaignSchema: CampaignJoiSchema, generalSchema: GeneralJoiSchema){
  
  app.post("/campaign/create",
  authMiddleware.strict,
  validationMiddleware.validateBody(campaignSchema.create),
  campaignController.create.bind(campaignController));
 
  app.get("/campaign/fetch/:id",
  authMiddleware.optional,
  validationMiddleware.validateParams(generalSchema.fetchById),
    validationMiddleware.validateQuery(generalSchema.populateFields),
  campaignController.fetchById.bind(campaignController));
 
  app.get("/campaign/fetchAny", // middleware:
  authMiddleware.optional,
  validationMiddleware.validateQuery( // schemas:
    generalSchema.orderByFilterLimit,
    generalSchema.category,
    generalSchema.search,
    generalSchema.newerThan,
    generalSchema.olderThan,
    generalSchema.populateFields,
    generalSchema.filterByLocation,
    generalSchema.filterByOwner,
  ),// controller function:
  campaignController.fetchAny.bind(campaignController));

  app.post("/campaign/assignItems", // middleware:
  authMiddleware.strict,
  validationMiddleware.validateBody( // schemas:
    campaignSchema.assignItems
    ),// controller function:
  campaignController.assignItems.bind(campaignController));

  app.post("/campaign/removeItems", // middleware:
  authMiddleware.strict,
  validationMiddleware.validateBody( // schemas:
    campaignSchema.removeItems
    ),// controller function:
  campaignController.removeItems.bind(campaignController));
 
  app.get("/campaign/fetchByProfile", // middleware:
  authMiddleware.optional,
  validationMiddleware.validateQuery( // schemas:
  generalSchema.fetchByProfile,
  generalSchema.orderByFilterLimit,
  generalSchema.category,
  generalSchema.search,
  generalSchema.newerThan,
  generalSchema.olderThan,
  generalSchema.populateFields,
  generalSchema.filterByLocation,
  generalSchema.filterByOwner
  ),// controller function:
  campaignController.fetchByProfile.bind(campaignController));
 
  app.delete("/campaign/delete/:id",
  authMiddleware.strict,
  validationMiddleware.validateParams(generalSchema.fetchById),
  campaignController.delete.bind(campaignController));
 
  app.post("/campaign/update",
  authMiddleware.strict,
  validationMiddleware.validateBody(
  campaignSchema.update
  ), campaignController.update.bind(campaignController));

  app.get("/campaign/fromSubscriptions", // middleware:
  authMiddleware.strict,
  validationMiddleware.validateQuery( // schemas:
      generalSchema.orderByFilterLimit,
      generalSchema.category,
      generalSchema.search,
      generalSchema.newerThan,
      generalSchema.olderThan,
      generalSchema.populateFields,
      generalSchema.filterByLocation,
      generalSchema.filterByOwner
  ),// controller function:
  campaignController.fetchSubscriptionCampaigns.bind(campaignController));
}
}