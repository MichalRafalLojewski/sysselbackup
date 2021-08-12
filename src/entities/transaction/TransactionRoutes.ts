import TransactionController from "./TransactionController";
import ValidationMiddleware from "../../general/middleware/ValidationMiddleware";
import AuthMiddleware from "../../general/middleware/AuthMiddleware";
import GeneralJoiSchema from "../../general/JoiSchemas/GeneralJoiSchema";

export default class TransactionRoutes{
  constructor(app, transactionController: TransactionController, validationMiddleware: ValidationMiddleware, authMiddleware: AuthMiddleware, generalSchema: GeneralJoiSchema){
      app.get("/transaction/fetch/:id",
      authMiddleware.optional,
      validationMiddleware.validateParams(generalSchema.fetchById),
      validationMiddleware.validateQuery(generalSchema.populateFields),
      transactionController.fetchById.bind(transactionController));

      app.get("/transaction/fetchMultiple", // middleware:
      authMiddleware.strict,
      validationMiddleware.validateQuery( // schemas:
        generalSchema.orderByFilterLimit,
        generalSchema.olderThan,
        generalSchema.newerThan,
        generalSchema.sender,
        generalSchema.receiver,
        generalSchema.populateFields
      ),// controller function:
      transactionController.fetchMultiple.bind(transactionController));
}
}