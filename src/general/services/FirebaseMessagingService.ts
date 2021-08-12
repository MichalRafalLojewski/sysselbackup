import CloudMessagingServiceIF from "./CloudMessagingServiceIF";
import LoggerIF from "../loggers/LoggerIF";
import NotificationIF from "../../entities/event/NotificationIF";

/**
* Module for providing general helper-methods for mongoose model operations
*/
export default class FirebaseMessagingService implements CloudMessagingServiceIF {

    private firebaseAdmin;
    private logger: LoggerIF;
    constructor(firebaseAdmin, logger: LoggerIF) {
        this.firebaseAdmin = firebaseAdmin;
        this.logger = logger;
    }

    /**
     * Sends a cloud-message to the given cleints
     * @param array of client_tokens to send the message to
     * @param payload 
     */
    async sendMessage(client_tokens: string[], notification: NotificationIF) {
        this.logger.info("FirebaseMessagingService", "Sending notification messages to clients: "+client_tokens);
        try {
            return await this.firebaseAdmin.messaging().sendMulticast({
                tokens: client_tokens,
                notification:notification
            });
        } catch (exception) {
            this.logger.error("FirebaseMessagingService", "Exception while sending cloud-message via firebase. Client-tokens: " + client_tokens, exception);
            throw exception.code ? exception : { code: 500, message: "Exception while sending cloud-message via firebase" };
        }

    }

}