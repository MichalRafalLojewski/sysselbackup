import QueryService from "../../general/services/QueryService";
import MessageIF from "./MessageIF";
import { Event } from "../event/EventIF";
import EventService from "../event/EventService";
import OrderChecker from "../order/OrderChecker";
import ProfileIF from "../profile/ProfileIF";
import MessageChecker from "./MessageChecker";
import to from 'await-to-js';
import BelongToService from "../../general/services/BelongsToService";
import LoggerIF from "../../general/loggers/LoggerIF";
import { EventKey } from "../event/EventKey";

/**
 * service for itemReview-related functionality
 */
export default class MessageService {
  private queryService: QueryService;
  private messageModel;
  private eventService: EventService;
  private orderChecker: OrderChecker;
  private messageChecker: MessageChecker;
  private belongsToService: BelongToService;
  private logger: LoggerIF;

  constructor(queryService: QueryService, messageModel, eventService: EventService, orderChecker: OrderChecker, messageChecker: MessageChecker, belongsToService: BelongToService, logger: LoggerIF) {
    this.queryService = queryService;
    this.messageModel = messageModel;
    this.eventService = eventService;
    this.orderChecker = orderChecker;
    this.messageChecker = messageChecker;
    this.belongsToService = belongsToService;
    this.logger = logger;
  }

  /**
 * Checks if the given object is a message
 */
  isMessage(obj): boolean {
    const me = this;
    return obj instanceof me.messageModel;
  }

  /**
* Creates a message from request 
*/
  async create(requestBody: MessageIF, current_profile: ProfileIF, receiver: ProfileIF, belongs_to_id?, belongs_to_kind?: string) {
    this.logger.info("MessageService", "Sending message. Sender: " + current_profile._id + ", Receiver: " + receiver._id + (belongs_to_id ? ", belongs_to_id: " + belongs_to_id + ", belongs_to_kind: " + belongs_to_kind : ""));
    let err,
      can_send: boolean,
      message_saved: MessageIF,
      belongs_to_accepted: boolean;
    const post_logic = async (message: MessageIF) => {
      this.logger.info("MessageService", "Performing post-logic");
      const participants: any[] = [message.sender._id, message.receiver._id];
      [err] = await to(this.eventService.create(new Event("Message", EventKey.MESSAGE_SEND, message._id, participants, belongs_to_id, belongs_to_kind)));
      if (err) {
        this.logger.error("MessageService", "Exception creating event", err);
        throw err.code ? err : { code: 500, message: "Error while creating event in post-logic" }
      }
      return true
    };
    // --- PRE-CONDITIONS -----
    if (belongs_to_id) {
      [err, belongs_to_accepted] = await to(this.belongsToService.belongsToAccepted(belongs_to_id, belongs_to_kind, current_profile._id, receiver._id)) // check if belongs_to_order is ok
      if (err) {
        this.logger.error("MessageService", "Exception checking belongs_to_accepted", err);
        throw err.code ? err : { code: 500, message: "Error while checking belongs_to_accepted" }
      }; // handle exception during belongs_to_order check
      if (!belongs_to_accepted) { throw { code: 401, message: "Profile does not participate in belongs_to relation" } } // handle not accepted  
    }
    [err, can_send] = await to(this.messageChecker.canSend(current_profile, receiver));
    if (err) {
      this.logger.error("MessageService", "Exception checking can_send", err);
      throw err.code ? err : { code: 500, message: "Error while checking message" }
    }
    if (!can_send) { throw { code: 403, message: "Cant send (sending to self?)" } }
    // ----- CREATION ------
    const message = new this.messageModel(requestBody);
    message.sender = current_profile._id;
    message.receiver = receiver._id;
    [err, message_saved] = await to(message.save());
    if (err) {
      this.logger.error("MessageService", "Exception saving message", err);
      throw err.code ? err : { code: 500, message: "Error while saving message" }
    };
    [err] = await to(post_logic(message));
    if (err) {
      this.logger.error("MessageService", "Exception during post-logic", err);
      throw err.code ? err : { code: 500, message: "Error during post-logic" }
    }
    return message_saved;
  };

}