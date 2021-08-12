import NotificationIF from "../../entities/event/NotificationIF";

/**
* Implemented by any cloud-messaging-service in order to send cloud-messages 8such as alerts) to clients
*/
export default interface CloudMessagingServiceIF {
    /**
     * Sends a cloud-message to the given clients
     * @param client_token 
     * @param payload 
     */
  sendMessage(client_tokens:string[], notification: NotificationIF);
}