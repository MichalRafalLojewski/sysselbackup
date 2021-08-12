import ProfileSubscriptionService from "../profileSubscription/ProfileSubscriptionService";
import QueryService from "../../general/services/QueryService";
import ProfileIF, { ProfileType } from "../profile/ProfileIF";
import ItemIF from "./ItemIF";
import CampaignIF from "../campaign/CampaignIF";
import ItemModel from "./Item";
import ItemChecker from "./ItemChecker";
import Responses from "../../general/consts/Responses";
import FileService from "../file/FileService";
import GeneralModelService from "../../general/services/GeneralModelService";
import FileIF from "../file/FileIF";
import MissionIF from "../mission/MissionIF";
import { BidIF } from "../bid/BidIF";
import to from 'await-to-js';
import LoggerIF from "../../general/loggers/LoggerIF";
import ItemOptionsIF from "../itemOptions/ItemOptionsIF";
import ItemOptionsService from "../itemOptions/ItemOptionsService";
import { FetchAllItemsOutDTO } from "./DTOs/FetchItemsDTO";
import GeneralEntityService from "../../general/services/GeneralEntityService";

/**
 * service for item-related functionality
 */
export default class ItemService {
  private itemModel;
  private profileSubscriptionService: ProfileSubscriptionService;
  private queryService: QueryService;
  private itemChecker: ItemChecker;
  private responses: Responses;
  private fileService: FileService;
  private generalModelService: GeneralModelService;
  private itemOptionsService: ItemOptionsService;
  private logger: LoggerIF;
  private generalEntityService: GeneralEntityService;
  constructor(itemModel, profileSubscriptionService: ProfileSubscriptionService, generalEntityService: GeneralEntityService, queryService: QueryService, itemChecker: ItemChecker, responses: Responses, fileService: FileService, generalModelService: GeneralModelService, itemOptionsService: ItemOptionsService, logger: LoggerIF) {
    this.itemModel = itemModel
    this.profileSubscriptionService = profileSubscriptionService;
    this.queryService = queryService;
    this.itemChecker = itemChecker;
    this.responses = responses;
    this.fileService = fileService;
    this.generalModelService = generalModelService;
    this.itemOptionsService = itemOptionsService;
    this.generalEntityService = generalEntityService;
    this.logger = logger;
  }

  /**
     * Checks if the given object is an item
     */
  isItem(obj): boolean {
    const me = this;
    return obj instanceof me.itemModel;
  }

  async fetchAll(): Promise<ItemIF[]> {
    return await this.itemModel.find({});
  }

  /**
  * Fetches a given item by id
  */
  async fetchById(id, requestBody: any = {}) {
    this.logger.info("ItemService", "Fetching item by id: " + id);
    try {
      const item = await this.queryService.populateFields(ItemModel.populateable(), requestBody, this.itemModel.findOne({ _id: id }));
      if (item && item.deleted == true) {
        throw { code: 404, message: "Not found" };
      }
      return item;
    } catch (exception) {
      this.logger.error("ItemService", "Exception fetching item", exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching item" };
    }
  };

  /**
   * Fetches multiple items by ids
   * @param ids 
   * @param additional_params 
   * @param requestBody 
   */
  async fetchMultipleById(ids: any[], additional_params: object = {}, requestBody = {}) {
    this.logger.info("ItemService", "(fetchMultipleById) Fetching multiple items by ids: [" + ids + "]");
    try {
      return this.queryService.populateFields(ItemModel.populateable(), requestBody,
        this.queryService.filterNotDeleted(requestBody,
          this.itemModel.find({ _id: ids, ...additional_params })));
    } catch (exception) {
      this.logger.error("ItemService", "Exception fetching multiple items", exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching" }
    }
  };

  /**
 * Fetches items by array of ids
 * ( supports regular filter operations and sorting)
 */
  async fetchByIds(ids: any[], current_profile: ProfileIF, requestBody = {}) {
    this.logger.info("ItemService", "(fetchByIds) Fetching multiple items by ids: [" + ids + "]");
    try {
      const items: ItemIF[] = await this.queryService.orderByOffsetLimit(requestBody,
        this.filterItemType(requestBody,
          this.queryService.filterNewerThan(requestBody,
            this.queryService.filterOlderThan(requestBody,
              this.queryService.filterSearch('title', requestBody,
                this.queryService.filterNear(requestBody,
                  this.queryService.filterActive_optional(requestBody,
                    this.queryService.filterListed_optional(requestBody,
                      this.queryService.filterOwnerProfile(requestBody,
                        this.queryService.filterOwnerUser(requestBody,
                          this.queryService.filterNotDeleted(requestBody,
                          this.excludeOutOfStock(requestBody,
                            this.queryService.populateFields(ItemModel.populateable(), requestBody,
                              this.itemModel.find({ _id: ids }) // find all conversations where current user is a participant
                            )))))))))))));
      return items.filter(item => this.itemChecker.profileCanAccessItem(current_profile, item)); // return only items which the current profile can access
    } catch (exception) {
      this.logger.error("ItemService", "Exception fetching multiple items", exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching" }
    }
  };

  /**
   * Fetches items from given campaign
   * @param campaign 
   * @param requestBody 
   */
  async fetchByCampaign(campaign: CampaignIF, requestBody) {
    this.logger.info("ItemService", "Fetching items by campaign: " + campaign._id);
    try {
      const item_ids: any[] = campaign.items;
      return await this.queryService.orderByOffsetLimit(requestBody,
        this.filterItemType(requestBody,
          this.queryService.filterActive_optional(requestBody,
            this.queryService.filterListed_optional(requestBody,
              this.queryService.filterNewerThan(requestBody,
                this.queryService.filterOlderThan(requestBody,
                  this.queryService.filterSearch('title', requestBody,
                    this.queryService.filterOwnerProfile(requestBody,
                      this.queryService.filterOwnerUser(requestBody,
                        this.queryService.filterNear(requestBody,
                          this.queryService.filterNotDeleted(requestBody,
                            this.excludeOutOfStock(requestBody,
                              this.queryService.populateFields(ItemModel.populateable(), requestBody,
                                this.itemModel.find({ _id: item_ids })
                              )))))))))))));
    } catch (exception) {
      this.logger.error("ItemService", "Exception items by campaign", exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching" }
    }
  };

  /**
   * Fetches items by profile
   * @param profile 
   * @param requestBody 
   */
  async fetchByProfile(profile: ProfileIF, requestBody) {
    this.logger.info("ItemService", "Fetching items by profile: " + profile._id);
    try {
      return await this.queryService.orderByOffsetLimit(requestBody,
        this.filterItemType(requestBody,
          this.queryService.filterActive_optional(requestBody,
            this.queryService.filterListed_optional(requestBody,
              this.queryService.filterNewerThan(requestBody,
                this.queryService.filterOlderThan(requestBody,
                  this.queryService.filterOwnerProfile(requestBody,
                    this.queryService.filterSearch('title', requestBody,
                      this.queryService.filterOwnerUser(requestBody,
                        this.queryService.filterNear(requestBody,
                          this.queryService.filterNotDeleted(requestBody,
                            this.excludeOutOfStock(requestBody,
                              this.queryService.populateFields(ItemModel.populateable(), requestBody,
                                this.itemModel.find({ owner_profile: profile._id })
                              )))))))))))));
    } catch (exception) {
      this.logger.error("ItemService", "Exception items by profile", exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching" }
    }
  };

  /**
   * Gets the total number of items 
   */
  async getCount(): Promise<number> {
    return await this.itemModel.count({});
  }

  /**
 * Fetches all items that match given search criteria
 */
  async fetchAny(current_profile: ProfileIF, requestBody): Promise<FetchAllItemsOutDTO> {
    this.logger.info("ItemService", "Fetching any (current profile: " + current_profile?._id + ")");
    try {
      const [totalCount, result] = await Promise.all([
        this.getCount(),
        this.queryService.orderByOffsetLimit(requestBody,
          this.filterItemType(requestBody,
            this.queryService.filterActive(requestBody,
              this.queryService.filterListed(requestBody,
                this.queryService.orderByOffsetLimit(requestBody,
                  this.queryService.filterSearch('title', requestBody,
                    this.queryService.filterNewerThan(requestBody,
                      this.queryService.filterOlderThan(requestBody,
                        this.queryService.filterCategory(requestBody,
                          this.queryService.filterOwnerProfile(requestBody,
                            this.queryService.filterOwnerUser(requestBody,
                              this.queryService.filterNear(requestBody,
                                this.queryService.filterNotDeleted(requestBody,
                                  this.excludeOutOfStock(requestBody,
                                    this.queryService.populateFields(ItemModel.populateable(), requestBody,
                                      this.itemModel.find({})
                                    )))))))))))))))
      ]);
      return {
        metaData: { totalCount },
        data: result
      };
    } catch (exception) {
      this.logger.error("ItemService", "Exception fetching any", exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching" }
    }
  };

  /**
  * Fetches items from profiles that the given profile subscribes to
  */
  async fetchSubscriptionItems(profile: ProfileIF, requestBody: any = {}) {
    this.logger.info("ItemService", "Fetching items from subscriptions");
    let err, subscriptions: any[];
    [err, subscriptions] = await to(this.profileSubscriptionService.fetchBySubscriber(profile));
    if (err) { throw err.code ? err : { code: 500, message: "Error while fetching" } }
    // find items:
    try {
      const profileIds: any[] = subscriptions.map(function (prof) {
        return prof.subscribe_to._id;
      });
      return await this.queryService.orderByOffsetLimit(requestBody,
        this.filterItemType(requestBody,
          this.queryService.filterCategory(requestBody,
            this.queryService.filterSearch('title', requestBody,
              this.queryService.filterActive(requestBody,
                this.queryService.filterListed(requestBody,
                  this.queryService.filterNewerThan(requestBody,
                    this.queryService.filterOlderThan(requestBody,
                      this.queryService.filterNear(requestBody,
                        this.queryService.filterOwnerProfile(requestBody,
                          this.queryService.filterOwnerUser(requestBody,
                            this.queryService.filterNotDeleted(requestBody,
                              this.excludeOutOfStock(requestBody,
                                this.queryService.populateFields(ItemModel.populateable(), requestBody,
                                  this.itemModel.find({}).where('owner_profile').in(profileIds)
                                ))))))))))))));
    } catch (exception) {
      this.logger.error("ItemService", "Exception fetching items from subscriptions", exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching" }
    }
  }

  /**
   * Generates an item from a given bid (used by missions to buy a winning bid)
   * @param mission 
   * @param bid 
   */
  generateItemFromBid(mission: MissionIF, bid: BidIF): ItemIF {
    return {
      title: mission.title,
      description: mission.description,
      category: mission.category,
      tags: mission.tags,
      item_type: 'bid',
      item_options: bid.item_options,
      price: bid.price,
      use_in_stock: false,
      listed: false
    };
  }

  /**
   * Creates an item from request
   * @param requestBody 
   * @param profile 
   */
  async create(requestBody, profile: ProfileIF) {
    this.logger.info("ItemService", "Creating new item");
    let err, item_saved: ItemIF, item_options: ItemOptionsIF;
    const post_logic = async (item: ItemIF) => {
      // increment profiles item-count:
      profile.number_of_items++;
      try {
        await profile.save();
      } catch (exception) {
        this.logger.error("ItemService", "Exception while saving profile during post-logic", exception);
        throw exception.code ? exception : { code: 500, message: "Error while saving profile during post-logic" }
      }
    };
    if (requestBody.item_options) {
      [err, item_options] = await to(this.itemOptionsService.fetchById(requestBody.item_options));
      if (err) {
        this.logger.error("ItemService", "Exception while fetching item_options: " + requestBody.item_options, err);
        throw err.code ? err : { code: 500, message: "Exception while fetching item_options: " + requestBody.item_options };
      }
      if (!item_options) {
        this.logger.error("ItemService", "item_options not found: " + requestBody.item_options);
        throw { code: 404, message: "item_options not found: " + requestBody.item_options };
      }
      if (!this.generalModelService.profileCanEditObj(profile, item_options)) {
        this.logger.security("ItemService", "Current profile does not have permission to access item-options: " + requestBody.item_options);
        throw { code: 401, message: "Current profile does not have permission to access item-options: " + requestBody.item_options };
      }
    }
    [err] = await to(this.generalEntityService.validatePictureBody(requestBody, profile));
    if (err) {
      this.logger.error("ItemService", "Valdiation or auth error for pictures", err);
      throw err.code ? err : { code: 400, message: "Error validating pictures" }
    }
    // create and store item
    let item: ItemIF = new this.itemModel(requestBody);
    item.owner_profile = profile._id;
    item.owner_user = profile.owner._id;
    item.favorited_count = 0;
    item.location = profile.location;
    [err, item_saved] = await to(item.save());
    if (err) {
      this.logger.error("ItemService", "Error while saving item", err);
      throw err.code ? err : { code: 500, message: "Error while saving item" }
    }
    [err] = await to(post_logic(item_saved));
    if (err) {
      this.logger.error("ItemService", "Error during post-logic", err);
      throw err.code ? err : { code: 500, message: "Error during post-logic" }
    }
    return item_saved;
  };

  /**
   * Updates a given item
   */
  async update(item: ItemIF, current_profile: ProfileIF, newBody) {
    this.logger.info("ItemService", "Updating item: " + item._id);
    let err, item_saved: ItemIF;
    const post_logic = async (profile: ProfileIF, obj_old: ItemIF, obj_new: ItemIF) => {
      // delete removed pictures:
      let deleted_orphaned_files: string[];
      // delete removed pictures:
      [err, deleted_orphaned_files] = await to(this.fileService.deleteOrpahnedFiles(profile, obj_old, obj_new));
      if (err) {
        this.logger.error("ItemService", "Error while deleting orphaned files during post-logic", err);
        throw err.code ? err : { code: 500, message: "Error while deleting orphaned files during post-logic" }
      }
      if (deleted_orphaned_files) {
        this.logger.info("ItemService", "Deleted orphaned files: [" + deleted_orphaned_files + "]")
      }
    }
    // check permissions:
    if (current_profile.type != ProfileType.ADMIN && !this.generalModelService.profileCanEditObj(current_profile, item)) {
      this.logger.error("ItemService", "Profile unauthorized to edit item. Profile: " + current_profile._id + ", Item: " + item._id);
      throw { code: 401, message: this.responses.unathorized };
    }
    [err] = await to(this.generalEntityService.validatePictureBody(newBody, current_profile));
    if (err) {
      this.logger.error("ItemService", "Valdiation or auth error for pictures", err);
      throw err.code ? err : { code: 400, message: "Error validating pictures" }
    }
    [err] = await to(this.itemModel.updateOne({ _id: item._id }, newBody));
    if (err) {
      this.logger.error("ItemService", "Error updating profile", err);
      throw err.code ? err : { code: 500, message: "Error while updating" }
    }
    [err, item_saved] = await to(this.fetchById(item._id));
    if (err) {
      this.logger.error("ItemService", "Exception while fetching item after update", err);
      throw err.code ? err : { code: 500, message: "Error while fetching after update" }
    }
    [err] = await to(post_logic(current_profile, item, item_saved));
    if (err) {
      this.logger.error("ItemService", "Exception during post-logic", err);
      throw err.code ? err : { code: 500, message: "Error during post-logic" }
    }
    return item_saved;
  };

  /**
   * Deletes all attached files form a given item
   * @param profile 
   * @param item 
   */
  async delete_files(profile: ProfileIF, item: ItemIF) {
    let err, files: FileIF[];
    const file_ids = [... (item.other_pics || []), ... (item.front_pic ? [item.front_pic] : [])].map(file => file._id);
    this.logger.info("ItemService", "Deleting attached files: " + file_ids);
    [err, files] = await to(this.fileService.fetchByIds(file_ids));
    const authFailedPics: FileIF[] = files.filter(pic => !this.generalModelService.profileCanEditObj(profile, pic));
    if (authFailedPics.length > 0) {
      this.logger.security("ItemService", "Profile unathorized to use pics: " + authFailedPics.map(pic => pic._id.toString()));
      throw { code: 401, message: "Profile unathorized to use pics: " + authFailedPics.map(pic => pic._id.toString()) };
    }
    [err] = await to(this.fileService.deleteMultiple(profile, files));
    if (err) {
      this.logger.error("ItemService", "Exception deleting attached files by ids", err);
      throw err.code ? err : { code: 500, message: "Error while deleting other_files during post-logic" }
    }
  }

  /**
  * Deletes a given item by id
  */
  async deleteById(itemId, profile: ProfileIF) {
    this.logger.info("ItemService", "Deleting item by id: " + itemId);
    let err, item: ItemIF;
    const post_logic = async (profile: ProfileIF) => {
      this.logger.info("ItemService", "Performing post-logic");
      // increment profiles item-count:
      try {
        profile.number_of_items--;
        await profile.save();
      } catch (exception) {
        this.logger.error("ItemService", "Exception saving profile during post-logic", exception);
        throw exception.code ? exception : { code: 500, message: "Error while saving profile during post-logic" };
      }
    };
    // business-logic:
    [err, item] = await to(this.fetchById(itemId));
    if (err) {
      this.logger.error("ItemService", "Exception saving profile during post-logic", err);
      throw err.code ? err : { code: 500, message: "Error while fetching item" }
    };
    if (!item) {
      this.logger.error("ItemService", "Item not found");
      throw { code: 404, message: "Item not found" }
    }
    const canEdit: boolean = this.generalModelService.profileCanEditObj(profile, item);
    if (!canEdit) {
      this.logger.security("ItemService", "Profile unauthorized to delete item. Profile: " + profile._id + ", Item: " + itemId, err);
      throw { code: 401, message: this.responses.unathorized }
    }
    item.deleted = true;
    [err] = await to(item.save());
    if (err) {
      this.logger.error("ItemService", "Exception while saving changes to item", err);
      throw err.code ? err : { code: 500, message: "Error while deleting item from db" }
    }
    [err] = await to(Promise.all([post_logic(profile), this.delete_files(profile, item)]));
    if (err) {
      this.logger.error("ItemService", "Exception during post-logic", err);
      throw err.code ? err : { code: 500, message: "Error during post-logic or while deleting attached files" }
    }
    return true;
  }


  // filters:
  /**
   * Includes only items of given type
   * @param requestBody 
   * @param query 
   */
  filterItemType(requestBody, query) {
    if (requestBody.item_type) {
      return query.find({ item_type: requestBody.item_type });
    }
    return query;
  }

  /**
  * Excludes items out of stock
  * @param req 
  * @param query 
  */
  excludeOutOfStock(requestBody, query) {
    if (requestBody.exclude_out_of_stock) {
      return query.or([{ use_in_stock: false }, { use_in_stock: true, in_stock: { $gt: 0 } }]);
    }
    return query;
  }
}