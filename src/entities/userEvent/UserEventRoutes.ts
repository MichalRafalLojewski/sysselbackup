import ValidationMiddleware from "../../general/middleware/ValidationMiddleware";
import AuthMiddleware from "../../general/middleware/AuthMiddleware";
import GeneralJoiSchema from "../../general/JoiSchemas/GeneralJoiSchema";
import EventJoiSchema from "../event/EventJoiSchema";
import UserEventController from "./UserEventController";

export default class UserEventRoutes {
    constructor(app, userEventController: UserEventController, eventJoiSchema: EventJoiSchema, validationMiddleware: ValidationMiddleware, authMiddleware: AuthMiddleware, generalSchema: GeneralJoiSchema) {

        app.get("/user/event/fetch/:id", // middleware:
        authMiddleware.strict,
        validationMiddleware.validateParams(generalSchema.fetchById),
        validationMiddleware.validateQuery(generalSchema.populateFields),
        userEventController.fetchById.bind(userEventController));

        app.get("/user/event/fetchByCurrent", // middleware:
        authMiddleware.strict,
        validationMiddleware.validateQuery( // schemas:
            generalSchema.orderByFilterLimit,
            generalSchema.newerThan,
            generalSchema.olderThan,
            generalSchema.populateFields,
            eventJoiSchema.fetchByCurrent,
            generalSchema.lastSignatureOnly
        ),// controller function:
        userEventController.fetchByCurrent.bind(userEventController));

        app.get("/user/event/fetchByCurrent", // middleware:
        authMiddleware.strict,
        validationMiddleware.validateQuery( // schemas:
            generalSchema.orderByFilterLimit,
            generalSchema.newerThan,
            generalSchema.olderThan,
            generalSchema.populateFields,
            eventJoiSchema.fetchByCurrent,
            generalSchema.lastSignatureOnly
        ),// controller function:
        userEventController.fetchByCurrent.bind(userEventController));

        app.get("/user/event/fetchWithParticipants", // middleware:
        authMiddleware.strict,
        validationMiddleware.validateQuery( // schemas:
        generalSchema.orderByFilterLimit,
        generalSchema.newerThan,
        generalSchema.olderThan,
        generalSchema.populateFields,
        eventJoiSchema.fetchWithParticipants,
        generalSchema.lastSignatureOnly
        ),// controller function:
        userEventController.fetchWithParticipants.bind(userEventController));
    }
}