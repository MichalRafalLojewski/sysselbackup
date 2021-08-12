import FileController from "./FileController";
import ValidationMiddleware from "../../general/middleware/ValidationMiddleware";
import AuthMiddleware from "../../general/middleware/AuthMiddleware";
import FileJoiSchema from "./FileJoiSchema";
import GeneralJoiSchema from "../../general/JoiSchemas/GeneralJoiSchema";

export default class ItemReviewRoutes {
   constructor(app, fileController: FileController, validationMiddleware: ValidationMiddleware, authMiddleware: AuthMiddleware, fileSchema: FileJoiSchema, generalSchema: GeneralJoiSchema) {
      app.post("/file/upload",
         authMiddleware.strict,
         fileController.upload.bind(fileController));

      app.get("/file/fetch/:id", // middleware:
         authMiddleware.optional,
         validationMiddleware.validateParams( // schemas:
            generalSchema.fetchById
         ),// controller function:
         fileController.fetchById.bind(fileController));

      app.get("/file/fetchMultipleByIds/:id", // middleware:
         authMiddleware.optional,
         validationMiddleware.validateQuery( // schemas:
            generalSchema.multipleIds
         ),// controller function:
         fileController.fetchByIds.bind(fileController));

      app.delete("/file/delete/:id",
         authMiddleware.strict,
         validationMiddleware.validateParams(generalSchema.fetchById),
         fileController.deleteById.bind(fileController));

      app.post("/file/deleteMultiple",
         authMiddleware.strict,
         validationMiddleware.validateBody(generalSchema.multipleIds),
         fileController.deleteByIds.bind(fileController));

   }
}