import QueryService from "../../general/services/QueryService";
import ItemOptionsIF from "./ItemOptionsIF";
import ProfileIF from "../profile/ProfileIF";
import ItemOptionsModel from "./ItemOptions";
import GeneralModelService from "../../general/services/GeneralModelService";
import Responses from "../../general/consts/Responses";
import to from 'await-to-js';
import LoggerIF from "../../general/loggers/LoggerIF";

/**
 * service for itemOptions-related functionality
 */
export default class ItemOptionsService {
  private queryService: QueryService;
  private itemOptionsModel;
  private generalModelService: GeneralModelService;
  private responses: Responses;
  private logger: LoggerIF;

  constructor(queryService: QueryService, itemOptionsModel, generalModelService: GeneralModelService, responses: Responses, logger: LoggerIF) {
    this.queryService = queryService;
    this.itemOptionsModel = itemOptionsModel;
    this.generalModelService = generalModelService;
    this.responses = responses;
    this.logger = logger;
  }


  /**
   * Checks if the given object is an itemOptions
   */
  isItemOptions(obj): boolean {
    return obj instanceof this.itemOptionsModel;
  }

  /**
   * Creates a new item-options
   */
  async create(requestBody: ItemOptionsIF, current_profile: ProfileIF): Promise<ItemOptionsIF> {
    let err, item_options: ItemOptionsIF;
    this.logger.info("ItemOptionsService", "Creating itemOptions. Profile: " + current_profile._id);
    const options = new this.itemOptionsModel(requestBody);
    options.owner_profile = current_profile._id;
    [err, item_options] = await to(options.save());
    if (err) {
      this.logger.error("ItemOptionsService", "Exception saving itemOptions", err);
      throw err.code ? err : { code: 500, message: "Error while saving ItemOptions" }
    }
    if (!current_profile.default_item_options) {
      current_profile.default_item_options = item_options._id;
      [err] = await to(current_profile.save());
      if (err) {
        this.logger.error("ItemOptionsService", "Exception saving current profile after creating item-options", err);
        throw err.code ? err : { code: 500, message: "Error while saving current profile" }
      }
    }
    return item_options;
  };

  /**
* Updates a given item-options
*/
  async update(profile: ProfileIF, itemOptions: ItemOptionsIF, newBody): Promise<ItemOptionsIF> {
    this.logger.info("ItemOptionsService", "Updating itemOptions. Profile: " + profile._id + ", itemOptions: " + itemOptions._id);
    let err, item_options_saved: ItemOptionsIF;
    if (!this.generalModelService.profileCanEditObj(profile, itemOptions)) { // check access
      this.logger.security("ItemOptionsService", "Profile is not authorized to update. Profile: " + profile._id + ", itemOptions: " + itemOptions._id);
      throw { code: 401, message: this.responses.unathorized };
    }
    [err] = await to(this.itemOptionsModel.updateOne({ _id: itemOptions._id }, newBody));
    if (err) {
      this.logger.error("ItemOptionsService", "Exception updating itemOptions", err);
      throw err.code ? err : { code: 500, message: "Error while updating itemOptions" }
    }
    [err, item_options_saved] = await to(this.itemOptionsModel.findOne({ _id: itemOptions._id }));
    if (err) {
      this.logger.error("ItemOptionsService", "Exception while fetching itemOptions after update", err);
      throw err.code ? err : { code: 500, message: "Error while fetching itemOptions after update" }
    }
    return item_options_saved;
  }

  /**
  * Fetches all item-options from a given user (by id)
  * offers order by, limit, offset
  */
  async fetchByCurrent(requestBody, current_profile: ProfileIF) {
    this.logger.info("ItemOptionsService", "Fetching itemOptions by current");
    try {
      return await this.queryService.orderByOffsetLimit(requestBody,
        this.queryService.populateFields(ItemOptionsModel.populateable(), requestBody,
          this.itemOptionsModel.find({ owner_profile: current_profile._id })));
    } catch (exception) {
      this.logger.error("ItemOptionsService", "Exception while fetching itemOptions by current", exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching" };
    }
  };

  /**
  * Fetches a given item-options by id
  */
  async fetchById(id, requestBody: any = {}) {
    this.logger.info("ItemOptionsService", "Fetching itemOptions by id: " + id);
    try {
      const itemOptions = await this.queryService.populateFields(ItemOptionsModel.populateable(), requestBody,
        this.itemOptionsModel.findOne({ _id: id }));
      if (itemOptions && itemOptions.deleted == true) {
        throw { code: 404, message: "Not found" };
      }
      return itemOptions;
    } catch (exception) {
      this.logger.error("ItemOptionsService", "Exception while fetching itemOptions by id", exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching" };
    }
  }

  /**
   * Deletes an  item-options by id
   * @param id 
   */
  async deleteById(profile: ProfileIF, id) {
    this.logger.info("ItemOptionsService", "Deleting itemOptions by id: " + id + ", Profile: " + profile._id);
    let err, itemOptions: ItemOptionsIF;
    [err, itemOptions] = await to(this.fetchById(id));
    if (err) {
      this.logger.error("ItemOptionsService", "Exception while fetching itemOptions before delete", err);
      throw err.code ? err : { code: 500, message: "Error while fetching itemOptions" }
    }
    if (!itemOptions) {
      this.logger.info("ItemOptionsService", "itemOptions not found", err);
      throw { code: 404, message: "Not found" };
    }
    if (!(this.generalModelService.profileCanEditObj(profile, itemOptions))) {
      this.logger.security("ItemOptionsService", "Profile is not authorized to delete. Profile: " + profile._id + ", itemOptions: " + id);
      throw { code: 401, message: "Unauthorized" };
    }
    itemOptions.deleted = true;
    [err] = await to(itemOptions.save());
    if (err) {
      this.logger.error("ItemOptionsService", "Exception while deleting", err);
      throw err.code ? err : { code: 500, message: "Error while deleting itemOptions" }
    }
    return { message: "success" };
  }
}