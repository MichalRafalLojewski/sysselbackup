import ProfileService from "../profile/ProfileService";
import QueryService from "../../general/services/QueryService";
import ProfileIF from "../profile/ProfileIF";
import ProfileSubscriptionChecker from "./ProfileSubscriptionChecker";
import Responses from "../../general/consts/Responses";
import Profile from "../profile/Profile";
import ProfileReviewModel from "../profileReview/ProfileReview";
import to from 'await-to-js';
import ProfileSubscriptionIF from "./ProfileSubscriptionIF";
import LoggerIF from "../../general/loggers/LoggerIF";

export default class ProfileSubscriptionService {
  private profileSubscriptionModel;
  private profileService: ProfileService;
  private queryService: QueryService;
  private profileSubscriptionChecker: ProfileSubscriptionChecker;
  private responses: Responses;
  private logger: LoggerIF;
  constructor(profileSubscriptionModel, profileService: ProfileService, queryService: QueryService, profileSubscriptionChecker: ProfileSubscriptionChecker, responses: Responses, logger: LoggerIF) {
    this.profileSubscriptionModel = profileSubscriptionModel;
    this.profileService = profileService;
    this.queryService = queryService;
    this.profileSubscriptionChecker = profileSubscriptionChecker;
    this.responses = responses;
    this.logger = logger;
  }

  /**
   * Checks if the given object is a campaignReview
   */
  isProfileSubscription(obj): boolean {
    const me = this;
    return obj instanceof me.profileSubscriptionModel;
  }

  /**
   * Fetches a specific profile-subscription given two profiles
   * @param profile 
   * @param subscribe_to 
   */
  async fetchSubscription(profile: ProfileIF, subscribe_to: ProfileIF, requestBody: any = {}): Promise<ProfileSubscriptionIF> {
    this.logger.info("ProfileSubscriptionService", "Fetching given subscription. Profile: " + profile._id + ", subscribe_to: " + subscribe_to._id);
    try {
      return await this.queryService.populateFields(ProfileReviewModel.populateable(), requestBody,
        this.profileSubscriptionModel.findOne({ profile: profile._id, subscribe_to: subscribe_to._id }));
    } catch (exception) {
      this.logger.error("ProfileSubscriptionService", "Exception fetching", exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching" };
    }
  }

  /**
   * Fetches subscriptions by profile
   */
  async fetchBySubscriber(subscriber_profile: ProfileIF, requestBody = {}) {
    this.logger.info("ProfileSubscriptionService", "Fetching subscriptions by subscriber. subscriber_profile: " + subscriber_profile._id);
    try {
      return await this.queryService.orderByOffsetLimit(requestBody,
        this.queryService.filterSearch('title', requestBody,
          this.queryService.filterNewerThan(requestBody,
            this.queryService.filterOlderThan(requestBody,
              this.queryService.filterListed_optional(requestBody,
                this.queryService.populateFields(Profile.populateable(), requestBody,
                  this.profileSubscriptionModel.find({ profile: subscriber_profile._id }) // find all conversations where current user is a participant
                ))))));
    } catch (exception) {
      this.logger.error("ProfileSubscriptionService", "Exception fetching", exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching" };
    }
  }

  /**
   * Fetches profiles that subscribes to the given profile
   */
  async fetchBySubscribingTo(profile: ProfileIF, requestBody: any = {}) {
    this.logger.info("ProfileSubscriptionService", "Fetching subscriptions by subscribing to. Profile: " + profile._id);
    try {
      return await this.queryService.orderByOffsetLimit(requestBody,
        this.queryService.filterSearch('title', requestBody,
          this.queryService.filterNewerThan(requestBody,
            this.queryService.filterOlderThan(requestBody,
              this.queryService.filterListed_optional(requestBody,
                this.queryService.populateFields(Profile.populateable(), requestBody,
                  this.profileSubscriptionModel.find({ subscribe_to: profile._id }) // find all conversations where current user is a participant
                ))))));
    } catch (exception) {
      throw exception.code ? exception : { code: 500, message: "Error while fetching" };
    }
  }

  /**
 * Fetches subscriptions by profile
 */
  async fetchProfilesBySubscriber(subscriber_profile: ProfileIF, requestBody): Promise<ProfileIF[]> {
    this.logger.info("ProfileSubscriptionService", "Fetching profiles by subscriber. subscriber_profile: " + subscriber_profile._id);
    let err, profile_ids: string[], profiles: ProfileIF[];
    try {
      const profile_id_objs: any[] = await this.profileSubscriptionModel.find({ profile: subscriber_profile._id }).select('subscribe_to');
      profile_ids = profile_id_objs.map((subscription) => subscription.subscribe_to._id ? subscription.subscribe_to._id : subscription.subscribe_to);
    } catch (exception) {
      this.logger.error("ProfileSubscriptionService", "Exception fetching profiles", exception);
      throw exception.code ? exception : { code: 500, message: "Error while fething profiles" };
    }
    [err, profiles] = await to(this.profileService.fetchByIds(profile_ids, requestBody));
    if (err) {
      this.logger.error("ProfileSubscriptionService", "Exception fetching profiles", err);
      throw err.code ? err : { code: 500, message: "Error while fetching profiles" }
    };
    return profiles;
  }

  /**
   * Fetches profiles that subscribes to the given profile
   */
  async fetchProfilesBySubscribingTo(profile: ProfileIF, requestBody): Promise<ProfileIF[]> {
    this.logger.info("ProfileSubscriptionService", "Fetching profiles by subscribing-to. profile: " + profile._id);
    let err, profile_ids: string[], profiles: ProfileIF[];
    try {
      const profile_id_objs = await this.profileSubscriptionModel.find({ subscribe_to: profile._id }).select('profile');
      profile_ids = profile_id_objs.map((subscription) => subscription.profile);
    } catch (exception) {
      this.logger.error("ProfileSubscriptionService", "Exception fething profiles", exception);
      throw exception.code ? exception : { code: 500, message: "Error while fething profiles" };
    }
    [err, profiles] = await to(this.profileService.fetchByIds(profile_ids, requestBody));
    if (err) {
      this.logger.error("ProfileSubscriptionService", "Exception fetching profiles", err);
      throw err.code ? err : { code: 500, message: "Error while fetching profiles" }
    };
    return profiles;
  }

  /**
  * Creates a subscription from current profile to another given profile
  * (current user subscribes to given user)
  */
  async subscribe(current_profile: ProfileIF, subscribe_to: ProfileIF) {
    this.logger.info("ProfileSubscriptionService", "Subscribing. Curren-rpofile: " + current_profile._id + ", subscribe_to: " + subscribe_to._id);
    let err, does_subscribe: boolean, subscription: ProfileSubscriptionIF;
    if (this.profileSubscriptionChecker.profilesSameOwner(current_profile, subscribe_to)) {
      this.logger.security("ProfileSubscriptionService", "Cant subscribe to profile owned by self");
      throw { code: 400, message: "Cant subscribe to profile owned by self" };
    }
    [err, does_subscribe] = await to(this.profileSubscriptionChecker.profileDoesSubscribe(current_profile, subscribe_to));
    if (err) {
      this.logger.error("ProfileSubscriptionService", "Exception checking does subscribe", err);
      throw err.code ? err : { code: 500, message: "Error while checking does subscribe" }
    };
    if (does_subscribe) {
      this.logger.info("ProfileSubscriptionService", "Already subscribing");
      throw { code: 400, message: "Already subscribing" }
    }
    // create and store subscription
    const subscription_obj = new this.profileSubscriptionModel();
    subscription_obj.subscribe_to = subscribe_to._id;
    subscription_obj.profile = current_profile._id; // set origin-user to current user (reference)
    [err, subscription] = await to(subscription_obj.save()); // save object to db and pass call-back func for on-success and fail
    if (err) {
      this.logger.error("ProfileSubscriptionService", "Exception saving subscription", err);
      throw err.code ? err : { code: 500, message: "Error while saving subscription" }
    };
    return subscription;
  }

  /**
  * Removes subscription between current user and given user
  */
  async unsubscribe(current_profile: ProfileIF, unsubscribe_to: ProfileIF) {
    this.logger.info("ProfileSubscriptionService", "Unsubscribing. Curren-rpofile: " + current_profile._id + ", unsubscribe_to: " + unsubscribe_to._id);
    let err, does_subscribe: boolean;
    [err, does_subscribe] = await to(this.profileSubscriptionChecker.profileDoesSubscribe(current_profile, unsubscribe_to));
    if (err) {
      this.logger.error("ProfileSubscriptionService", "Exception schecking does subscribe", err);
      throw err.code ? err : { code: 500, message: "Erorr while checking does subscribe" }
    }
    if (!does_subscribe) {
      this.logger.error("ProfileSubscriptionService", "Not subscribing");
      throw { code: 400, message: "Not subscribing" }
    }
    [err] = await to(this.profileSubscriptionModel.deleteOne({ profile: current_profile._id, subscribe_to: unsubscribe_to._id }));
    if (err) {
      this.logger.error("ProfileSubscriptionService", "Exception deleting from db", err);
      throw err.code ? err : { code: 500, message: "Erorr while deleting from db" }
    }
    return { message: "success" };
  }

}