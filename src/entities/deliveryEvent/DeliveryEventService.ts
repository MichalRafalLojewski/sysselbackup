import QueryService from "../../general/services/QueryService";
import ProfileIF from "../profile/ProfileIF";
import ItemModel from "./DeliveryEvent";
import to from 'await-to-js';
import LoggerIF from "../../general/loggers/LoggerIF";
import Responses from "../../general/consts/Responses";
import DeliveryEventIF from "./DeliveryEventIF";
import PickupLocationService from "../pickupLocation/PickupLocationService";
import PickupLocationIF from "../pickupLocation/PickupLocationIF";

/**
 * service for delivery-event
 */
export default class DeliveryEventService {
  private deliveryEventModel;
  private queryService: QueryService;
  private logger: LoggerIF;
  private responses: Responses;
  private pickupLocationService: PickupLocationService;

  constructor(deliveryEventModel, pickupLocationService: PickupLocationService, queryService: QueryService, responses: Responses, logger: LoggerIF) {
    this.deliveryEventModel = deliveryEventModel
    this.queryService = queryService;
    this.pickupLocationService = pickupLocationService;
    this.responses = responses;
    this.logger = logger;
  }

  /**
 * Creates a delivery-event
 * @param requestBody 
 * @param profile 
 */
  async create(requestBody: DeliveryEventIF, profile: ProfileIF): Promise<DeliveryEventIF> {
    this.logger.info("DeliveryEventService", "Creating new delivery-event");
    let err, deliveryEvent_saved: DeliveryEventIF, pickupLocation: PickupLocationIF;

    [err, pickupLocation] = await to(this.pickupLocationService.fetchById(requestBody.pickup_location));
    if (err) {
      this.logger.error("DeliveryEventService", "Error while fetching pickup location: " + requestBody.pickup_location, err);
      throw err.code ? err : { code: 500, message: "Error while fetching pickup location: " + requestBody.pickup_location }
    }
    if (!pickupLocation) {
      this.logger.error("DeliveryEventService", "Pickup-location not found: " + requestBody.pickup_location, err);
      throw { code: 404, message: "Pickup location not found: " + requestBody.pickup_location };
    }
    // create and store item
    let deliveryEvent: PickupLocationIF = new this.deliveryEventModel(requestBody);
    [err, deliveryEvent_saved] = await to(deliveryEvent.save());
    if (err) {
      this.logger.error("DeliveryEventService", "Error while saving delivery-event", err);
      throw err.code ? err : { code: 500, message: "Error while saving delivery-event" }
    }
    return deliveryEvent_saved;
  };

  /**
 * Updates a given delivery-event
 */
  async update(deliveryEvent: DeliveryEventIF, newBody) {
    this.logger.info("DeliveryEventService", "Updating delivery-event: " + deliveryEvent._id);
    let err, pickupLocation_saved: DeliveryEventIF;
    [err] = await to(this.deliveryEventModel.updateOne({ _id: deliveryEvent._id }, newBody));
    if (err) {
      this.logger.error("DeliveryEventService", "Error updating delivery-event", err);
      throw err.code ? err : { code: 500, message: "Error while updating" }
    }
    [err, pickupLocation_saved] = await to(this.fetchById(deliveryEvent._id));
    if (err) {
      this.logger.error("DeliveryEventService", "Exception while fetching delivery-event after update", err);
      throw err.code ? err : { code: 500, message: "Error while fetching after update" }
    }
    return pickupLocation_saved;
  };

  /**
  * Fetches a given item by id
  */
  async fetchById(id, requestBody: any = {}): Promise<DeliveryEventIF> {
    this.logger.info("DeliveryEventService", "Fetching by id: " + id);
    try {
      const deliveryEvent = await this.queryService.populateFields(ItemModel.populateable(), requestBody, this.deliveryEventModel.findOne({ _id: id }));
      if (deliveryEvent && deliveryEvent.deleted == true) {
        throw { code: 404, message: "Not found" };
      }
      return deliveryEvent;
    } catch (exception) {
      this.logger.error("DeliveryEventService", "Exception fetching", exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching delivery-event" };
    }
  };

  /**a
  * Filters events after
* @param Query-builder to perform on
* @param Request
*/
  filterAfter(req, query) {
    if (req.after) {
      const date = new Date(req.after);
      return query.find({ date: { $gt: date } });
    }
    return query;
  }

  /**
  * Filters events before
  * @param Query-builder to perform on
  * @param Request
  */
  filterBefore(req, query) {
    if (req.before) {
      const date = new Date(req.before);
      return query.find({ created_at: { $lt: date } });
    }
    return query;
  }

  /**
 * Fetches all delivery-events that match given search criteria
 */
  async fetchMultiple(requestBody): Promise<DeliveryEventIF[]> {
    this.logger.info("DeliveryEventService", "Fetching any");
    try {
      return this.queryService.filterActive(requestBody,
        this.queryService.orderByOffsetLimit(requestBody,
          this.queryService.filterSearch('label', requestBody,
            this.queryService.filterNewerThan(requestBody,
              this.queryService.filterOlderThan(requestBody,
                this.queryService.filterNotDeleted(requestBody,
                  this.filterBefore(requestBody,
                    this.filterAfter(requestBody,
                      this.queryService.populateFields(ItemModel.populateable(), requestBody,
                        this.deliveryEventModel.find({})
                      )))))))));
    } catch (exception) {
      this.logger.error("DeliveryEventService", "Exception fetching any", exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching" }
    }
  };


  /**
* Deletes a given delivery-event by id
*/
  async deleteById(deliveryEventId): Promise<boolean> {
    this.logger.info("DeliveryEventService", "Deleting by id: " + deliveryEventId);
    let err, deliveryEvent: DeliveryEventIF;
    // business-logic:
    [err, deliveryEvent] = await to(this.fetchById(deliveryEventId));
    if (!deliveryEvent) {
      this.logger.error("DeliveryEventService", "delivery-event not found");
      throw { code: 404, message: "delivery-event not found" }
    }
    deliveryEvent.deleted = true;
    [err] = await to(deliveryEvent.save());
    if (err) {
      this.logger.error("DeliveryEventService", "Exception while saving changes to delivery-event", err);
      throw err.code ? err : { code: 500, message: "Error while deleting delivery-event from db" }
    }
    return true;
  }

}