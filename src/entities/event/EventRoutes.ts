import EventController from "./EventController";
import ValidationMiddleware from "../../general/middleware/ValidationMiddleware";
import AuthMiddleware from "../../general/middleware/AuthMiddleware";
import GeneralJoiSchema from "../../general/JoiSchemas/GeneralJoiSchema";
import EventJoiSchema from "./EventJoiSchema";

export default class EventRoutes {
    constructor(app, eventController: EventController, eventJoiSchema: EventJoiSchema, validationMiddleware: ValidationMiddleware, authMiddleware: AuthMiddleware, generalSchema: GeneralJoiSchema) {

        app.get("/event/fetch/:id", // middleware:
        authMiddleware.strict,
        validationMiddleware.validateParams(generalSchema.fetchById),
        validationMiddleware.validateQuery(generalSchema.populateFields),
        eventController.fetchById.bind(eventController));

        app.get("/event/fetchByCurrent", // middleware:
        authMiddleware.strict,
        validationMiddleware.validateQuery( // schemas:
            generalSchema.orderByFilterLimit,
            generalSchema.newerThan,
            generalSchema.olderThan,
            generalSchema.populateFields,
            eventJoiSchema.fetchByCurrent,
            generalSchema.lastSignatureOnly
        ),// controller function:
        eventController.fetchByCurrent.bind(eventController));

        app.get("/event/fetchEventParticipantsByCurrent", // middleware:
        authMiddleware.strict,
        validationMiddleware.validateQuery( // schemas:
            generalSchema.orderByFilterLimit,
            generalSchema.newerThan,
            generalSchema.olderThan,
            generalSchema.populateFields,
            eventJoiSchema.fetchByCurrent,
            generalSchema.lastSignatureOnly
        ),// controller function:
        eventController.fetchEventParticipantsByCurrent.bind(eventController));

        app.get("/event/fetchWithParticipants", // middleware:
        authMiddleware.strict,
        validationMiddleware.validateQuery( // schemas:
        generalSchema.orderByFilterLimit,
        generalSchema.newerThan,
        generalSchema.olderThan,
        generalSchema.populateFields,
        eventJoiSchema.fetchWithParticipants,
        generalSchema.lastSignatureOnly
        ),// controller function:
        eventController.fetchWithParticipants.bind(eventController));
    }
}