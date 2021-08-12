import QueryService from "../../general/services/QueryService";
import EventService from "../event/EventService";
import { Event } from "../event/EventIF";
import ProfileIF from "../profile/ProfileIF";
import ProfileReviewIF from "./ProfileReviewIF";
import ProfileReviewChecker from "./ProfileReviewChecker";
import ProfileReview from "./ProfileReview";
import OrderService from "../order/OrderService";
import to from 'await-to-js';
import RequestOutIF from "../RequestOutIF";
import GeneralModelService from "../../general/services/GeneralModelService";
import BelongToService from "../../general/services/BelongsToService";
import LoggerIF from "../../general/loggers/LoggerIF";
import { EventKey } from "../event/EventKey";
import OrderIF from "../order/OrderIF";

/**
 * service for itemReview-related functionality
 */
export default class ItemReviewService {

  private queryService: QueryService;
  private profileReviewModel;
  private eventService: EventService;
  private profileReviewChecker: ProfileReviewChecker;
  private orderService: OrderService;
  private generalModelService: GeneralModelService;
  private belongsToService: BelongToService;
  private logger: LoggerIF;
  constructor(queryService: QueryService, eventService: EventService, profileReviewChecker: ProfileReviewChecker, profileReviewModel, orderService: OrderService, generalModelService: GeneralModelService, belongsToService: BelongToService, logger: LoggerIF) {
    this.queryService = queryService;
    this.profileReviewModel = profileReviewModel;
    this.eventService = eventService;
    this.profileReviewChecker = profileReviewChecker;
    this.orderService = orderService;
    this.generalModelService = generalModelService;
    this.belongsToService = belongsToService;
    this.logger = logger;
  }

  /**
   * Checks if the given object is a profileReviewModel
   */
  isProfileReview(obj): boolean {
    const me = this;
    return obj instanceof me.profileReviewModel;
  }

  /**
* Fetches a given item-review by id
*/
  async fetchById(id, requestBody = {}) {
    this.logger.info("ProfileReviewService", "Fetching by id: " + id);
    try {
      return await this.queryService.populateFields(ProfileReview.populateable(), requestBody, this.profileReviewModel.findOne({ _id: id }));
    } catch (exception) {
      this.logger.error("ProfileReviewService", "Exception fetching", exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching" };
    }
  }

  /**
 * Fetches all profile-reviews from a given profile
 * offers order by, limit, offset
 */
  async fetchFrom(profile: ProfileIF, requestBody = {}) {
    this.logger.info("ProfileReviewService", "Fetching profile-reviews from profile: " + profile._id);
    try {
      return await this.queryService.orderByOffsetLimit(requestBody,
        this.queryService.filterNewerThan(requestBody,
          this.queryService.filterOlderThan(requestBody,
            this.queryService.filterOwnerProfile({ owner_id: profile._id },
              this.queryService.populateFields(ProfileReview.populateable(), requestBody,
                this.profileReviewModel.find({})
              )))));
    } catch (exception) {
      this.logger.error("ProfileReviewService", "Exception fetching", exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching" };
    }

  };

  /**
  * Fetches all reviews a given profile has received
  * offers order by, limit, offset
  */
  async fetchTo(profile: ProfileIF, requestBody = {}) {
    this.logger.info("ProfileReviewService", "Fetching profile-reviews to profile: " + profile._id);
    try {
      return await this.queryService.orderByOffsetLimit(requestBody,
        this.queryService.filterItem(requestBody,
          this.queryService.filterNewerThan(requestBody,
            this.queryService.filterOlderThan(requestBody,
              this.queryService.filterOwnerProfile(requestBody,
                this.queryService.populateFields(ProfileReview.populateable(), requestBody,
                  this.profileReviewModel.find({ profile: profile._id })
                ))))));
    } catch (exception) {
      this.logger.error("ProfileReviewService", "Exception fetching", exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching" };
    }
  };

  /**
   * Posts a review for a given profile
   */
  async create(requestBody: ProfileReviewIF, owner_profile: ProfileIF, target_profile: ProfileIF) {
    let err,
      can_review: boolean,
      order: OrderIF,
      review: ProfileReviewIF,
      origin_order_id = requestBody.order;
    this.logger.info("ProfileReviewService", "Creating new profile-review. From-profile: " + owner_profile._id.toString() + ", to-profile: " + target_profile._id.toString() + " (belongs_to_id: " + origin_order_id + ", belongs_to_kind: Order) " + " order_id: " + origin_order_id);
    const on_logic_complete = async (profileReview: ProfileReviewIF) => {
      target_profile.sum_rating += profileReview.rating;
      target_profile.number_of_ratings++;
      [err] = await to(target_profile.save());
      if (err) {
        this.logger.error("ProfileReviewService", "Exception during post logic: saving target-profile", err);
        throw { code: 500, message: "Error during post logic: saving target-profile" }
      }
      [err] = await to(this.eventService.create(new Event("ProfileReview", EventKey.PROFILE_REVIEW_CREATED, profileReview._id, [owner_profile._id, target_profile._id], order._id, "Order")));
      if (err) {
        this.logger.error("ProfileReviewService", "Exception during post logic: creating event", err);
        throw { code: 500, message: "Error during post logic: creating event" }
      }
    };
    // ---- PRE-CONDITONS: -----
    [err, can_review] = await to(this.profileReviewChecker.canReviewProfile(owner_profile, target_profile));
    if (err) {
      this.logger.error("ProfileReviewService", "Error check if can review");
      throw { code: 500, message: "Error checking if can review" };
    }
    if (!can_review) {
      this.logger.security("ProfileReviewService", "Can't review self");
      throw { code: 403, message: "Can't review self" };
    }

    [err, order] = await to(this.orderService.fetchById(origin_order_id));
    if (err) {
      this.logger.error("ProfileReviewService", "Exception fetching order with id: " + origin_order_id, err);
      throw err.code ? err : { code: 500, message: "Error while fetching order" };
    }
    if (!order) {
      this.logger.error("ProfileReviewService", "Order not found: " + origin_order_id, err);
      throw { code: 404, message: "Order not found" };
    }
    if (order.seller._id.toString() != target_profile._id.toString()) {
      this.logger.security("ProfileReviewService", "Target profile: " + target_profile._id.toString() + " not seller of order: " + origin_order_id, err);
      throw { code: 403, message: "Target profile not seller of given order" };
    }
    if (order.buyer._id.toString() != owner_profile._id.toString()) {
      this.logger.security("ProfileReviewService", "Current profile: " + owner_profile._id.toString() + " not buyer of order: " + origin_order_id, err);
      throw { code: 403, message: "Current profile not buyer of given order" };
    }
    if (order.has_review) {
      this.logger.security("ProfileReviewService", "Current profile already reviewed starget profile for order: " + origin_order_id, err);
      throw { code: 403, message: "Current profile already reviewed target profile for given order" };
    }
    // ---- CREATION ------
    const review_obj = new this.profileReviewModel(requestBody);
    review_obj.owner_profile = owner_profile._id;
    [err, review] = await to(review_obj.save());
    if (err) {
      this.logger.error("ProfileReviewService", "Exception during creation: saving review", err);
      throw { code: 500, message: "Error during creation: saving review" }
    }
    order.has_review = true;
    [err] = await to(order.save());
    if (err) {
      this.logger.error("ProfileReviewService", "Exception during creation: saving order: " + origin_order_id, err);
      throw { code: 500, message: "Error during creation: saving order" }
    }
    [err] = await to<void, RequestOutIF>(on_logic_complete(review));
    if (err) {
      this.logger.error("ProfileReviewService", "Exception during post-logic", err);
      throw err.code ? err : { code: 500, message: "Error during post-logic" }
    };
    return review;
  };

  async hasReviewed(profile: ProfileIF, target_profile: ProfileIF): Promise<boolean> {
    this.logger.info("ProfileReviewService", "Checking has-reviewed. Profile: " + profile._id + ", target_profile: " + target_profile._id);
    try {
      return (await this.profileReviewModel.find({ owner_profile: profile._id, profile: target_profile._id })).length > 0;
    } catch (exception) {
      this.logger.error("ProfileReviewService", "Exception fetching", exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching" };
    }
  }

  /**
   * Deletes a given profile-review by id
   */
  async deleteById(profile: ProfileIF, id) {
    this.logger.info("ProfileReviewService", "Deleting profile-review by id: " + id + ". Current profile: " + profile._id);
    let err, review: ProfileReviewIF;
    [err, review] = await to(this.fetchById(id));
    if (err) { throw err.code ? err : { code: 500, message: "Error while fetching review" } }
    if (!(this.generalModelService.profileCanEditObj(profile, review))) // check that current user owns parent campaign
    {
      this.logger.security("ProfileReviewService", "Profile unauthrorized to perform action");
      throw { code: 401, message: "Unauthorized" };
    }
    try {
      await this.profileReviewModel.deleteOne({ _id: id });
      return true;
    } catch (exception) {
      this.logger.error("ProfileReviewService", "Exception deleting", exception);
      throw exception.code ? exception : { code: 500, message: "Error while deleting" };
    }
  }
}