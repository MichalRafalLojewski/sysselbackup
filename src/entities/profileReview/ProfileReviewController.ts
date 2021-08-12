import ProfileReviewService from "./ProfileReviewService";
import Responses from "../../general/consts/Responses";
import ResponseService from "../../general/services/ResponseService";
import ProfileReviewIF from "./ProfileReviewIF";
import ProfileService from "../profile/ProfileService";
import ProfileIF from "../profile/ProfileIF";
import RequestOutIF from "../RequestOutIF";
import OrderIF from "../order/OrderIF";
import OrderService from "../order/OrderService";

export default class ProfileReviewController {
  private profileService: ProfileService;
  private profileReviewService: ProfileReviewService;
  private responses: Responses;
  private responseService: ResponseService;
  private orderService: OrderService;
  constructor(profileService: ProfileService, profileReviewService: ProfileReviewService, responses: Responses, responseService: ResponseService, orderService: OrderService) {
    this.profileService = profileService;
    this.profileReviewService = profileReviewService;
    this.responses = responses;
    this.responseService = responseService;
    this.orderService = orderService;
  }

  /**
 * Fetches a given profile-review by id
 * @param req 
 * @param res 
 */
  async fetchById(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (review: ProfileReviewIF) => me.responseService.respond(res, 200, review);
    let profileReview: ProfileReviewIF;
    try {
      profileReview = await this.profileReviewService.fetchById(req.params.id, req.query);
      if (!profileReview) {
        return anyErr({ code: 404, message: "ProfileReview not found" });
      }
    } catch (exception) {
      return exception.code ? anyErr(exception) : anyErr({ code: 500, message: "Error while fetching profile-review" });
    }
    ok(profileReview);
  }

  /**
  * Posts a review for a given profile
  */
  async create(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (review: ProfileReviewIF) => me.responseService.respond(res, 200, review);
    // fetch order for belongs_to_order
    let target_profile: ProfileIF;
    try { // fetch target profile
      target_profile = await me.profileService.fetchById(req.body.profile);
    } catch (exception) {
      if (exception.code) {
        return anyErr(exception);
      }
      return anyErr({ code: 500, message: "Error while fetching target profile" });
    }
    if (!target_profile) {
      return anyErr({ code: 404, message: "Profile not found" });
    }
    // create and store review:
    me.profileReviewService.create(req.body, req.profile, target_profile).then(ok).catch(anyErr);
  };

  /**
   * Fetches all profile-reviews from a given profile
   * offers order by, limit, offset
   */
  fetchFrom(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) =>  me.responseService.respond(res, response.code, { message: response.message }),
      ok = (reviews: ProfileReviewIF[]) => me.responseService.respond(res, 200, reviews);
    me.profileService.fetchById(req.params.owner_profile).then((profile: ProfileIF) => {
      if (!profile) {
        return anyErr({ code: 404, message: "Not found" });
      }
      me.profileReviewService.fetchFrom(profile, req.query).then(ok).catch(anyErr);
    }).catch(anyErr);
  };


  /**
   * Fetches all profile-reviews from a given profile
   * offers order by, limit, offset
   */
  fetchTo(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (reviews: ProfileReviewIF[]) => me.responseService.respond(res, 200, reviews);
    me.profileService.fetchById(req.params.id).then((profile: ProfileIF) => {
      if (!profile) {
        return anyErr({ code: 404, message: "Not found" });
      }
      me.profileReviewService.fetchTo(profile, req.query).then(ok).catch(anyErr);
    }).catch(anyErr);
  };


  /**
  * Deletes a given profile-review
  */
  deleteById(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = () => me.responseService.respond(res, 200, { message: me.responses.success });
    me.profileReviewService.deleteById(req.profile, req.params.id).then(ok).catch(anyErr);
  };

}