import MessageController from "./MessageController";
import ValidationMiddleware from "../../general/middleware/ValidationMiddleware";
import AuthMiddleware from "../../general/middleware/AuthMiddleware";
import MessageJoiSchema from "./MessageJoiSchema";

export default class MessageRoutes {

    constructor(app, messageController: MessageController, validationMiddleware: ValidationMiddleware, authMiddleware: AuthMiddleware, messageSchema: MessageJoiSchema) {
        app.post("/message/send",
            authMiddleware.strict,
            validationMiddleware.validateBody(messageSchema.send),
            messageController.send.bind(messageController));
    }
}