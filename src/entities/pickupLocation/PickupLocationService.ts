import QueryService from "../../general/services/QueryService";
import ItemModel from "./PickupLocation";
import to from 'await-to-js';
import LoggerIF from "../../general/loggers/LoggerIF";
import PickupLocationIF from "./PickupLocationIF";

/**
 * service for pickup-location
 */
export default class PickupLocationService {
  private pickupLocationModel;
  private queryService: QueryService;
  private logger: LoggerIF;

  constructor(pickupLocationModel, queryService: QueryService, logger: LoggerIF) {
    this.pickupLocationModel = pickupLocationModel
    this.queryService = queryService;
    this.logger = logger;
  }

  /**
 * Creates a pickup-location
 * @param requestBody 
 * @param profile 
 */
  async create(requestBody): Promise<PickupLocationIF> {
    this.logger.info("PickupLocationService", "Creating new pickup-location");
    let err, pickupLocation_saved: PickupLocationIF;
    // create and store 
    let pickupLocation: PickupLocationIF = new this.pickupLocationModel(requestBody);
    [err, pickupLocation_saved] = await to(pickupLocation.save());
    if (err) {
      this.logger.error("PickupLocationService", "Error while saving pickup-location", err);
      throw err.code ? err : { code: 500, message: "Error while saving pickup-location" }
    }
    return pickupLocation_saved;
  };

  /**
 * Updates a given pickup-location
 */
  async update(pickupLocation: PickupLocationIF, newBody) {
    this.logger.info("PickupLocationService", "Updating pickup-location: " + pickupLocation._id);
    let err, pickupLocation_saved: PickupLocationIF;
    [err] = await to(this.pickupLocationModel.updateOne({ _id: pickupLocation._id }, newBody));
    if (err) {
      this.logger.error("PickupLocationService", "Error updating pickup-location", err);
      throw err.code ? err : { code: 500, message: "Error while updating" }
    }
    [err, pickupLocation_saved] = await to(this.fetchById(pickupLocation._id));
    if (err) {
      this.logger.error("PickupLocationService", "Exception while fetching pickup-location after update", err);
      throw err.code ? err : { code: 500, message: "Error while fetching after update" }
    }
    return pickupLocation_saved;
  };

  /**
  * Fetches a given item by id
  */
  async fetchById(id, requestBody: any = {}): Promise<PickupLocationIF> {
    this.logger.info("PickupLocationService", "Fetching by id: " + id);
    try {
      const pickupLocation = await this.queryService.populateFields(ItemModel.populateable(), requestBody, this.pickupLocationModel.findOne({ _id: id }));
      if (pickupLocation && pickupLocation.deleted == true) {
        throw { code: 404, message: "Not found" };
      }
      return pickupLocation;
    } catch (exception) {
      this.logger.error("PickupLocationService", "Exception fetching", exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching pickup-location" };
    }
  };

  /**
 * Fetches all pickup-locations that match given search criteria
 */
  async fetchMultiple(requestBody): Promise<PickupLocationIF[]> {
    this.logger.info("PickupLocationService", "Fetching multiple");
    try {
      return this.queryService.filterActive(requestBody,
        this.queryService.orderByOffsetLimit(requestBody,
          this.queryService.filterSearch('label', requestBody,
            this.queryService.filterNewerThan(requestBody,
              this.queryService.filterOlderThan(requestBody,
                this.queryService.filterNear(requestBody,
                  this.queryService.filterNotDeleted(requestBody,
                  this.queryService.populateFields(ItemModel.populateable(), requestBody,
                    this.pickupLocationModel.find({})
                  ))))))));
    } catch (exception) {
      this.logger.error("PickupLocationService", "Exception fetching any", exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching" }
    }
  };


  /**
* Deletes a given pickup-location by id
*/
  async deleteById(pickupLocationId): Promise<boolean> {
    this.logger.info("PickupLocationService", "Deleting by id: " + pickupLocationId);
    let err, pickupLocation: PickupLocationIF;
    // business-logic:
    [err, pickupLocation] = await to(this.fetchById(pickupLocationId));
    if (!pickupLocation) {
      this.logger.error("PickupLocationService", "Pickup-location not found");
      throw { code: 404, message: "Pickup-location not found" }
    }
    pickupLocation.deleted = true;
    [err] = await to(pickupLocation.save())
    if (err) {
      this.logger.error("PickupLocationService", "Exception while deleting pickup-location", err);
      throw err.code ? err : { code: 500, message: "Error while deleting pickup-location from db" }
    }
    return true;
  }

}