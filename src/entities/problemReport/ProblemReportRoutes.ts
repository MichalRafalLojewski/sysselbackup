import ValidationMiddleware from "../../general/middleware/ValidationMiddleware";
import AuthMiddleware from "../../general/middleware/AuthMiddleware";
import GeneralJoiSchema from "../../general/JoiSchemas/GeneralJoiSchema";
import ProblemReportJoiSchema from "./ProblemReportJoiSchema";
import ProblemReportController from "./ProblemReportController";

export default class ProblemReportRoutes {
  constructor(app, problemReportController: ProblemReportController, validationMiddleware: ValidationMiddleware, authMiddleware: AuthMiddleware, problemReportSchema: ProblemReportJoiSchema, generalSchema: GeneralJoiSchema) {
    app.post("/problemReport/create",
      authMiddleware.strict,
      validationMiddleware.validateBody(problemReportSchema.create),
      problemReportController.create.bind(problemReportController));

    app.get("/problemReport/fetch/:id",
      authMiddleware.admin,
      validationMiddleware.validateParams(generalSchema.fetchById),
      validationMiddleware.validateQuery(generalSchema.populateFields),
      problemReportController.fetchById.bind(problemReportController)); // owner-version of fetch by id - exposes potentially private info to owner only

    app.get("/problemReport/fetchMultiple",
      authMiddleware.admin,
      validationMiddleware.validateQuery(
        generalSchema.orderByFilterLimit,
        generalSchema.olderThan,
        generalSchema.newerThan,
        generalSchema.search,
        generalSchema.populateFields,
        problemReportSchema.fetchMultiple
      ),
      problemReportController.fetchMultiple.bind(problemReportController)); // owner-version of fetch by id - exposes potentially private info to owner only

    app.delete("/problemReport/delete/:id",
      authMiddleware.admin,
      validationMiddleware.validateParams(generalSchema.fetchById),
      problemReportController.deleteById.bind(problemReportController));
  }
}