import ValidationMiddleware from "../../general/middleware/ValidationMiddleware";
import AuthMiddleware from "../../general/middleware/AuthMiddleware";
import GeneralJoiSchema from "../../general/JoiSchemas/GeneralJoiSchema";
import BidController from "./BidController";
import BidJoiSchema from "./BidJoiSchema";

export default class BidRoutes{
constructor(app, bidController: BidController, validationMiddleware: ValidationMiddleware, authMiddleware: AuthMiddleware, bidSchema: BidJoiSchema, generalSchema: GeneralJoiSchema){
  
  app.post("/bid/create",
  authMiddleware.strict,
  validationMiddleware.validateBody(bidSchema.create),
  bidController.create.bind(bidController));
 
  app.get("/bid/fetch/:id",
  authMiddleware.optional,
  validationMiddleware.validateParams(generalSchema.fetchById),
  validationMiddleware.validateQuery(generalSchema.populateFields),
  bidController.fetchById.bind(bidController));
 
  app.get("/bid/fetchMultiple", // middleware:
  authMiddleware.strict,
  validationMiddleware.validateQuery( // schemas:
  generalSchema.orderByFilterLimit,
  generalSchema.populateFields,
  generalSchema.filterByOwner,
  ),// controller function:
  bidController.fetchMultiple.bind(bidController));

  app.get("/bid/fetchByMission/:id", // middleware:
  authMiddleware.strict,
  validationMiddleware.validateParams(generalSchema.fetchById),
  validationMiddleware.validateQuery( // schemas:
  generalSchema.orderByFilterLimit,
  generalSchema.populateFields,
  generalSchema.filterByOwner
  ),// controller function:
  bidController.fetchByMission.bind(bidController));
 
  app.delete("/bid/delete/:id",
  authMiddleware.strict,
  validationMiddleware.validateParams(generalSchema.fetchById),
  bidController.delete.bind(bidController));

  app.post("/bid/accept/:id",
  authMiddleware.strict,
  validationMiddleware.validateParams( generalSchema.fetchById),
  bidController.accept.bind(bidController));

  app.post("/bid/reject/:id",
  authMiddleware.strict,
  validationMiddleware.validateParams( generalSchema.fetchById),
  bidController.reject.bind(bidController));

}
}