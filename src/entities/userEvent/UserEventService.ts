import { EventIF } from "../event/EventIF";
import QueryService from "../../general/services/QueryService";
import Event from "../event/Event";
import BelongsToRelateableIF from "../BelongsToRelateableIF";
import BelongToService from "../../general/services/BelongsToService";
import to from 'await-to-js';
import LoggerIF from "../../general/loggers/LoggerIF";
import CloudMessagingServiceIF from "../../general/services/CloudMessagingServiceIF";
import {UserIF} from "../user/UserIF";
import NotificationIF from "../event/NotificationIF";
import UserService from "../user/UserService";
import { EventKey } from "../event/EventKey";

export default class UserEventService {
  private userEventModel;
  private queryService: QueryService;
  private userService: UserService;
  private belongsToService: BelongToService;
  private logger: LoggerIF;
  private cloudMessageService: CloudMessagingServiceIF;

  constructor(queryService: QueryService, userEventModel, belongsToService: BelongToService, userService: UserService, cloudMessageService: CloudMessagingServiceIF, logger: LoggerIF) {
    this.userEventModel = userEventModel;
    this.queryService = queryService;
    this.belongsToService = belongsToService;
    this.userService = userService;
    this.logger = logger;
    this.cloudMessageService = cloudMessageService;
  }

  static validBelongsToTypes(): string[] {
    return ["Order", "Mission", "Transaction"];
  }

  /**
   * Checks if the given object is an event
   */
  isEvent(obj): boolean {
    return obj instanceof this.userEventModel;
  }

  /**
   * Fetches a given user-event by id
   */
  async fetchById(id, requestBody = {}) {
    let err, event: EventIF;
    this.logger.info("UserEventService", "Fetching user-event by id: " + id);
    [err, event] = await to(this.queryService.populateFields(Event.populateable(), requestBody,
      this.userEventModel.findOne({ _id: id })));
    if (err) {
      this.logger.error("EventService", "Exception while fetching event by id: " + id, err);
      throw err.code ? err : { code: 500, message: "Error while fetching event" };
    }
    if (!event) {
      throw { code: 404, message: "Event not found" };
    }
    return event;
  }

  /**
   * Fetches all events where given participants participate
   * @param requestBody object
   * @param array of participants (ids)
   * @last_signature_only boolean -> when true, only the id and craeted_at of first object in result is returned
   */
  async fetchWithParticipants(requestBody, participants: string[], last_signature_only: boolean = false): Promise<EventIF[]> {
    try {
      this.logger.info("UserEventService", "Fetching events with participants: " + participants);
      let query =
        this.queryService.orderByOffsetLimit(requestBody,
          this.queryService.filterNewerThan(requestBody,
            this.queryService.filterOlderThan(requestBody,
              this.filterEventType(requestBody,
                this.filterEventKey(requestBody,
                  this.filterBelongsTo(requestBody,
                    this.queryService.populateFields(Event.populateable(), requestBody,
                      last_signature_only ? this.userEventModel.findOne({ participants: { $all: participants } }) : this.userEventModel.find({ participants: { $all: participants } })
                    )))))));
      return await (last_signature_only ? query.select('_id created_at') : query);
    } catch (exception) {
      this.logger.error("UserEventService", "Exception during fetchWithParticipants. RequestBody: " + JSON.stringify(requestBody) + " \nParticipants: " + participants, exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching user-events" }
    }
  }

  /**
  * Creates a new event
  */
  async create(eventObj: EventIF, also_send_as_cloud_message: boolean = true, origin_user_id?: string) {
    this.logger.info("UserEventService", "Creating user-event");
    let err, belongs_to_obj: BelongsToRelateableIF, participants: UserIF[], event_saved: EventIF;
    if (eventObj.belongs_to) { // logic when there is a belongs-to relation
      if (!UserEventService.validBelongsToTypes().includes(eventObj.belongs_to_kind)) {
        this.logger.error("UserEventService", "Invalid  belongs to kind: " + eventObj.belongs_to_kind);
        throw { code: 400, message: "Invalid  belongs to kind. Allowed: " + UserEventService.validBelongsToTypes() }
      }
      [err, belongs_to_obj] = await to(this.belongsToService.fetchBelongsTo(eventObj.belongs_to, eventObj.belongs_to_kind));
      if (err) {
        this.logger.error("UserEventService", "Exception while fetching belongs_to entity: " + eventObj.belongs_to, err);
        throw err.code ? err : { code: 500, message: "Error while fetching belongs-to-entity" }
      }
      if (!belongs_to_obj) { throw { code: 404, message: "Belongs-to entity not found" } }
      belongs_to_obj.last_event = Date.now();
      [err] = await to(belongs_to_obj.save());
      if (err) {
        this.logger.error("UserEventService", "Exception while saving changes to belongs_to entity: " + eventObj.belongs_to, err);
        throw err.code ? err : { code: 500, message: "Error while saving belongs-to-entity after updating last_event field" }
      }
    }
    const event = new this.userEventModel(eventObj);
    [err, event_saved] = await to(event.save());
    if (err) {
      this.logger.error("UserEventService", "Exception while saving new user-event. Body: " + eventObj, err);
      throw { code: 500, message: "Error saving event" };
    }
    // fetch by id to populate data field
    [err, event_saved] = await to(this.fetchById(event_saved._id, { populate: ['data_object', 'participants'] }));
    if (err) {
      this.logger.error("UserEventService", "Exception fetching user-event by id: " + event_saved._id, err);
      throw { code: 500, message: "Error fetching event" };
    }
    // send cloud message/notification of event:
    if (also_send_as_cloud_message) {
      this.logger.info("UserEventService", "Sending notifications to clients");
      [err, participants] = await to(this.userService.fetchByIds(eventObj.participants));
      if (err) {
        this.logger.error("UserEventService", "Exception while fetching participant users of event. Participants: " + eventObj.participants, err);
        throw { code: 500, message: "Error fetching participants of event" };
      }
      if (err) {
        this.logger.error("UserEventService", "Exception while fetching users of participants of event. Participant-users: " + participants.map(participant => participant._id), err);
        throw { code: 500, message: "Error fetching users of participants of event" };
      }
      let client_tokens = [];
      participants.forEach((participant: UserIF) => { // dont include current user
        if (!origin_user_id || participant._id.toString() != origin_user_id) {
          client_tokens = client_tokens.concat(participant.client_tokens);
        }
      });
      if (client_tokens.length > 0) {
        const notification: NotificationIF = this.eventToNotification(event_saved);
        [err] = await to(this.cloudMessageService.sendMessage(client_tokens, notification));
        if (err) {
          this.logger.error("UserEventService", "Exception while sending event-notification to client-tokens: " + client_tokens);
          throw { code: 500, message: "Error while sending event-notification to clients" };
        }
      } else {
        this.logger.info("UserEventService", "No client_tokens to send notifications to");
      }
    }
    return event_saved;
  }

  /**
   * Produces a notification from a given event
   * @param event 
   */
  eventToNotification(event: EventIF): NotificationIF {
    const generate_title = (event): string => {
      switch (event.event_key) {
        case EventKey.MESSAGE_SEND: return "Message from " + event.data_object.sender.title;
        case EventKey.ORDER_CREATE: return "Order received - " + event.data_object.buyer.title;
        case EventKey.ORDER_PAID: return "Order paid - " + event.data_object.buyer.title;
        case EventKey.ORDER_CANCEL: return "Order cancelled - " + event.data_object.buyer.title;
        case EventKey.ORDER_ACCEPT: return "Order accepted - " + event.data_object.buyer.title;
        case EventKey.ORDER_REJECT: return "Order rejected - " + event.data_object.buyer.title;
        case EventKey.PAYMENT_SENT: return "Payment sent/received - " + event.data_object.buyer.title;
        case EventKey.PAYIN_SUCCESS: return "Payment succeeded";
        case EventKey.PAYIN_FAILED: return "Payment failed";
        case EventKey.PAYMENT_CONFIRMED_BUYER: return "Buyer confirmed payment sent";
        case EventKey.PAYMENT_CONFIRMED_SELLER: return "Seller confirmed payment received";
        case EventKey.BID_ACCEPTED: "Bid accepted";
        case EventKey.BID_RECEIVED: "Bid received";
        case EventKey.BID_REJECTED: "Bid rejected";
      }
    }
    return { title: generate_title(event), body: event._id.toString() };
  }

  /**
   * Filters the request by data_object kind
   * @param requestBody 
   * @param query 
   */
  private filterEventType(requestBody, query) {
    if (requestBody.kind) {
      this.logger.info("UserEventService", "Applying filter: filterEventType");
      return query.find({ kind: requestBody.kind });
    }
    return query;
  }

  /**
 * Filters the request by data_object event_key
 * @param requestBody 
 * @param query 
 */
  private filterEventKey(requestBody, query) {
    if (requestBody.event_key) {
      this.logger.info("UserEventService", "Applying filter function: filterEventKey");
      return query.find({ event_key: requestBody.event_key });
    }
    return query;
  }

  private filterBelongsTo(requestBody, query) {
    if (requestBody.belongs_to === null || requestBody.belongs_to == "NULL") {
      this.logger.info("UserEventService", "Applying filter function: filterBelongsTo with belongs_to = NULL");
      return query.find({ belongs_to: null });
    }
    if (requestBody.belongs_to) {
      this.logger.info("UserEventService", "Applying filter function: filterBelongsTo with belongs_to = " + requestBody.belongs_to);
      return query.find({ belongs_to: { _id: requestBody.belongs_to } });
    }
    return query;
  }
}