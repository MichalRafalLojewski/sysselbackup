import QueryService from "../../general/services/QueryService";
import ItemReviewIF from "./ItemReviewIF";
import EventService from "../event/EventService";
import { Event } from "../event/EventIF";
import ItemIF from "../item/ItemIF";
import ProfileIF from "../profile/ProfileIF";
import OrderChecker from "../order/OrderChecker";
import ItemReviewChecker from "./ItemReviewChecker";
import ItemReviewModel from "./ItemReview";
import ProfileService from "../profile/ProfileService";
import to from 'await-to-js';
import RequestOutIF from "../RequestOutIF";
import GeneralModelService from "../../general/services/GeneralModelService";
import BelongToService from "../../general/services/BelongsToService";
import LoggerIF from "../../general/loggers/LoggerIF";
import { EventKey } from "../event/EventKey";

/**
 * service for itemReview-related functionality
 */
export default class ItemReviewService {

  private queryService: QueryService;
  private itemReviewModel;
  private eventService: EventService;
  private itemReviewChecker: ItemReviewChecker;
  private profileService: ProfileService;
  private generalModelService: GeneralModelService;
  private belongsToService: BelongToService;
  private logger: LoggerIF;
  constructor(queryService: QueryService, eventService: EventService, itemReviewModel, itemReviewChecker: ItemReviewChecker, profileService: ProfileService, generalModelService: GeneralModelService, belongsToService: BelongToService, logger: LoggerIF) {
    this.queryService = queryService;
    this.itemReviewModel = itemReviewModel;
    this.eventService = eventService;
    this.itemReviewChecker = itemReviewChecker;
    this.profileService = profileService;
    this.generalModelService = generalModelService;
    this.belongsToService = belongsToService;
    this.logger = logger;
  }

  /**
   * Checks if the given object is a itemReviewModel
   */
  isItemReview(obj): boolean {
    return obj instanceof this.itemReviewModel;
  }

  /**
 * Fetches a given item-review by id
 */
  async fetchById(id, requestBody: any = {}): Promise<ItemReviewIF> {
    this.logger.info("ItemReviewService", "Fetching itemReview by id: " + id);
    try {
      const review = await this.queryService.populateFields(ItemReviewModel.populateable(), requestBody,
        this.itemReviewModel.findOne({ _id: id }));
      if (review && review.deleted == true) {
        throw { code: 404, message: "Not found" };
      }
      return review;
    } catch (exception) {
      this.logger.error("ItemReviewService", "Exception fetching itemReview", exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching" };
    }
  }

  /**
   * Fetches all item-reviews from a given user (by id)
   * offers order by, limit, offset
   */
  async fetchByProfile(requestBody): Promise<ItemReviewIF[]> {
    this.logger.info("ItemReviewService", "Fetching itemReviews by profile")
    try {
      return await this.queryService.orderByOffsetLimit(requestBody,
        this.queryService.filterNewerThan(requestBody,
          this.queryService.filterOlderThan(requestBody,
            this.queryService.filterOwnerProfile(requestBody,
              this.queryService.filterNotDeleted(requestBody,
                this.queryService.populateFields(ItemReviewModel.populateable(), requestBody,
                  this.itemReviewModel.find({})
                ))))));
    } catch (exception) {
      this.logger.error("ItemReviewService", "Exception fetching itemReviews by profile", exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching" };
    }
  }

  /**
  * Fetches all reviews from a given item
  * offers order by, limit, offset
  */
  async fetchByItem(requestBody): Promise<ItemReviewIF[]> {
    this.logger.info("ItemReviewService", "Fetching itemReviews by item")
    try {
      return await this.queryService.orderByOffsetLimit(requestBody,
        this.queryService.filterItem(requestBody,
          this.queryService.filterNewerThan(requestBody,
            this.queryService.filterOlderThan(requestBody,
              this.queryService.filterOwnerProfile(requestBody,
                this.queryService.filterNotDeleted(requestBody,
                  this.queryService.populateFields(ItemReviewModel.populateable(), requestBody,
                    this.itemReviewModel.find({})
                  )))))));
    } catch (exception) {
      this.logger.error("ItemReviewService", "Exception fetching itemReviews by item", exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching" };
    }
  };

  /**
   * Checks if the given profile has reviewed the given item
   * @param profile 
   * @param item 
   */
  async hasReviewed(profile: ProfileIF, item: ItemIF): Promise<boolean> {
    this.logger.info("ItemReviewService", "Checking if has reviewed item");
    try {
      return (await this.queryService.filterOwnerProfile({ owner_id: profile._id },
        this.queryService.filterItem({ id: item._id },
          this.itemReviewModel.find({})
        ))).length > 0;
    } catch (exception) {
      this.logger.error("ItemReviewService", "Exception checking if has reviewed", exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching itemReviews to check existence" };
    }
  }

  /**
 * Posts a review for a given item
 */
  async create(requestBody: ItemReviewIF, item: ItemIF, owner_profile: ProfileIF, belongs_to_id?, belongs_to_kind?: string): Promise<ItemReviewIF> {
    this.logger.info("ItemReviewService", "Creating itemReview. Item: " + item._id + ", Profile: " + owner_profile._id);
    let err,
      exception: RequestOutIF,
      target_profile: ProfileIF,
      belongs_to_accepted: boolean,
      can_review: boolean,
      has_reviewed: boolean,
      review: ItemReviewIF;
    const on_logic_complete = async (item_review: ItemReviewIF) => {
      this.logger.info("ItemReviewService", "Performing post-logic on itemReview: " + item_review._id);
      // add to sum and number of ratings:
      item.sum_rating += item_review.rating;
      item.number_of_ratings++;
      [err] = await to(item.save());
      // create event
      if (err) {
        this.logger.error("ItemReviewService", "Exception saving item: " + item._id + " during post logic on itemReview");
        throw { code: 500, message: "Error during post logic: saving item" }
      }
      [err] = await to(this.eventService.create(new Event("ItemReview", EventKey.ITEM_REVIEW_CREATED, item_review._id, [owner_profile._id, item.owner_profile._id], belongs_to_id, belongs_to_kind)));
      if (err) {
        this.logger.error("ItemReviewService", "Exception creating event during post-logic", err);
        throw { code: 500, message: "Error during post logic: creating event" }
      }
    };
    // --- PRE-CONDITONS ------
    [exception, target_profile] = await to(this.profileService.fetchById(item.owner_profile._id)); // fetch target-profile
    if (exception) {
      this.logger.error("ItemReviewService", "Exception owner-profile of item", exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching target profile" }
    }; // handle exception during fetch of target profile
    if (!target_profile) {
      this.logger.error("ItemReviewService", "Profile not found");
      throw { code: 404, message: "Profile not found" }
    } // handle target_profile not found
    if (belongs_to_id) {
      [exception, belongs_to_accepted] = await to(this.belongsToService.belongsToAccepted(belongs_to_id, belongs_to_kind, owner_profile._id, target_profile._id)) // check if belongs_to_order is ok
      if (exception) {
        this.logger.error("ItemReviewService", "Exception while checking belongs_to_accepted");
        throw exception.code ? exception : { code: 500, message: "Error while checking belongs_to_accepted" }
      }; // handle exception during belongs_to_order check
      if (!belongs_to_accepted) { throw { code: 401, message: "Profile does not participate in belongs_to relation" } } // handle not accepted  
    }
    try {
      [can_review, has_reviewed] = await Promise.all([
        this.itemReviewChecker.canReviewItem(owner_profile, item), // check current profile allowed to review
        this.hasReviewed(owner_profile, item)]); // check current profile already reviewed?
      if (!can_review || has_reviewed == true) {
        this.logger.error("ItemReviewService", "Can't review self, or has already reviewed");
        throw { code: 403, message: "Can't review self, or has already reviewed" };
      }
    } catch (exception) {
      this.logger.error("ItemReviewService", "Exception during checking of rights", exception);
      throw exception.code ? exception : { code: 500, message: "Error during checking of rights" };
    }
    // ----- CREATION ------
    const review_obj = new this.itemReviewModel(requestBody);
    review_obj.owner_profile = owner_profile._id;
    [err, review] = await to(review_obj.save());
    if (err) {
      this.logger.error("ItemReviewService", "Exception saving review");
      throw { code: 500, message: "Error during creation: saving review" }
    }
    [exception] = await to<void, RequestOutIF>(on_logic_complete(review));
    if (exception) {
      this.logger.error("ItemReviewService", "Exception during post-logic");
      throw exception.code ? exception : { code: 500, message: "Error during post-logic" }
    };
    return review;
  };

  /**
 * Deletes a given item-review by id
 */
  async deleteById(profile: ProfileIF, id) {
    this.logger.info("ItemReviewService", "Deleting item-review by id. Profile: " + profile._id + ", Id: " + id);
    let err, review: ItemReviewIF;
    [err, review] = await to(this.fetchById(id));
    if (err) {
      this.logger.error("ItemReviewService", "Exception fetching review by id", err);
      throw err.code ? err : { code: 500, message: "Error while fetching review" }
    };
    if (!review) {
      this.logger.error("ItemReviewService", "Not found");
      throw { code: 404, message: "Not found" }
    }
    // check rights:
    if (!this.generalModelService.profileCanEditObj(profile, review)) { throw { code: 401, message: "Unauthorized" } }
    // delete
    review.deleted = true;
    [err] = await to(review.save());
    if (err) {
      this.logger.error("ItemReviewService", "Exception while deleting from db", err);
      throw err.code ? err : { code: 500, message: "Error while deleting" }
    }
    return { message: "success" };
  }
}