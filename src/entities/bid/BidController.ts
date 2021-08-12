import Responses from "../../general/consts/Responses";
import ResponseService from "../../general/services/ResponseService";
import BidService from "./BidService";
import {BidIF, BidStatus} from "./BidIF";
import RequestOutIF from "../RequestOutIF";
import MissionService from "../mission/MissionService";
import MissionIF from "../mission/MissionIF";

/**
* Controller module for mission-related requests.
*/
export default class BidController {
  private bidService: BidService;
  private responses: Responses;
  private responseService: ResponseService;
  private missionService: MissionService;
  constructor(bidService: BidService, responses: Responses, responseService: ResponseService, missionService: MissionService) {
    this.responses = responses;
    this.responseService = responseService;
    this.bidService = bidService;
    this.missionService = missionService;
  }

  /**
  * Fetches a given mission by id
  */
  fetchById(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (bid: BidIF) => this.responseService.respond(res, 200, bid);
    this.bidService.fetchById(req.params.id, req.query).then(function (bid: BidIF) {
      if (!bid) {
        return anyErr({ code: 404, message: "Not found" });
      }
      ok(bid);
    }).catch(anyErr);
  }

  /**
   * Creates a mission from request, and returns the object or validation error response if invalid
   */
  create(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (campaign) => this.responseService.respond(res, 200, campaign);
    this.bidService.create(req.body, req.profile).then(ok).catch(anyErr);
  };

  /**
  * Accepts a given bid
  */
  accept(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (out) => me.responseService.respond(res, 200, out);
    me.bidService.fetchById(req.params.id).then((bid: BidIF) => {
      if (!bid) {
        return anyErr({ code: 404, message: "Not found" });
      }
      me.bidService.changeStatus(bid, BidStatus.ACCEPTED).then(ok).catch(anyErr);
    }).catch(anyErr);
  };

   /**
  * Accepts a given bid
  */
 reject(req, res) {
  const me = this,
    anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
    ok = (out) => me.responseService.respond(res, 200, out);
  me.bidService.fetchById(req.params.id).then((bid: BidIF) => {
    if (!bid) {
      return anyErr({ code: 404, message: "Not found" });
    }
    me.bidService.changeStatus(bid, BidStatus.REJECTED).then(ok).catch(anyErr);
  }).catch(anyErr);
};


  /**
  * Fetches all bids from a given profile (by id)
  * offers order by, limit, offset
  */
 fetchMultiple(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (bids: BidIF[]) => this.responseService.respond(res, 200, bids);
    this.bidService.fetchMultiple(req.profile, req.query).then(ok).catch(anyErr);
  };

  /**
  * Fetches all bids from a given mission (by id)
  * offers order by, limit, offset
  */
  fetchByMission(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (bids: BidIF[]) => this.responseService.respond(res, 200, bids);
      this.missionService.fetchById(req.params.id).then((mission: MissionIF) => {
        if (!mission){
          return anyErr({code: 404, message: "Mission not found"});
        }
        this.bidService.fetchByMission(mission, req.query).then(ok).catch(anyErr);
      }).catch(anyErr);
  };
  /**
  * Deletes a given campaign by id
  * NOTE: Might be improved... fetches the given model twice from db... complexity might also be reduced
  */
  delete(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = () => me.responseService.respond(res, 200, { message: me.responses.success });
    me.bidService.fetchById(req.params.id).then(function (bid: BidIF) {
      if (!bid) {
        return anyErr({ code: 404, message: "Not found" });
      }
      // success, user owns campaign, delete it:
      me.bidService.delete(req.profile, bid).then(ok).catch(anyErr);
    }).catch(anyErr);
  };

};
