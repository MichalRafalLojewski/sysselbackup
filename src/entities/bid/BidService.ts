import { BidIF, BidStatus } from "./BidIF";
import ProfileIF from "../profile/ProfileIF";
import QueryService from "../../general/services/QueryService";
import Bid from "./Bid";
import MissionIF from "../mission/MissionIF";
import MissionService from "../mission/MissionService";
import ItemService from "../item/ItemService";
import { Event } from "../event/EventIF";
import EventService from "../event/EventService";
import ItemIF from "../item/ItemIF";
import ProfileService from "../profile/ProfileService";
import to from 'await-to-js';
import BidChecker from "./BidChecker";
import GeneralModelService from "../../general/services/GeneralModelService";
import LoggerIF from "../../general/loggers/LoggerIF";
import { EventKey } from "../event/EventKey";

export default class BidService {

  private bidModel;
  private queryService: QueryService;
  private missionService: MissionService;
  private itemService: ItemService;
  private eventService: EventService;
  private profileService: ProfileService;
  private bidChecker: BidChecker;
  private generalModelService: GeneralModelService;
  private logger: LoggerIF;
  
  constructor(bidModel, queryService: QueryService, missionService: MissionService, eventService: EventService, profileService: ProfileService, itemService: ItemService, bidChecker: BidChecker, generalModelService: GeneralModelService, logger: LoggerIF) {
    this.bidModel = bidModel;
    this.queryService = queryService;
    this.missionService = missionService;
    this.eventService = eventService;
    this.profileService = profileService;
    this.itemService = itemService;
    this.bidChecker = bidChecker;
    this.generalModelService = generalModelService;
    this.logger = logger;
  }

  /**
 * Checks if the given object is a bid
 */
  isBid(obj): boolean {
    return obj instanceof this.bidModel;
  }

  /**
   * Fetches a given mission by id
   */
  async fetchById(id, requestBody: any = {}): Promise<BidIF> {
    try {
      this.logger.info("BidService", "Fetching bid by id: "+id+", requestBody: "+JSON.stringify(requestBody));
      return await this.queryService.populateFields(Bid.populateable(), requestBody, this.bidModel.findOne({ _id: id }));
    } catch (exception) {
      this.logger.error("BidService", "Error while fetching bid by id.  ID: "+id+" requestBody: "+JSON.stringify(requestBody),exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching" };
    }
  }

  /**
  * Fetches all bids where current profile participates
  */
  async fetchMultiple(profile: ProfileIF, requestBody = {}) {
    try {
      this.logger.info("BidService", "Fetching bids with participant: "+profile._id.toString()+", requestBody: "+JSON.stringify(requestBody));
      return await this.queryService.orderByOffsetLimit(requestBody,
        this.queryService.filterNewerThan(requestBody,
          this.queryService.filterOlderThan(requestBody,
            this.queryService.filterCategory(requestBody,
              this.queryService.populateFields(Bid.populateable(), requestBody,
                this.queryService.filterOwnerProfile(requestBody, 
                  this.bidModel.find({participants: profile._id}) // current user must be buyer or seller
                  ))))));
    } catch (exception) {
      this.logger.error("BidService", "Error while fetching bids with participant: "+profile._id.toString()+" requestBody: "+JSON.stringify(requestBody),exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching" };
    }
  };

  /**
   * Fetches all bids by given msision
   */
  async fetchByMission(mission: MissionIF, requestBody = {}) {
    try {
      this.logger.info("BidService", "Fetching bids by mision: "+mission._id.toString()+", requestBody: "+JSON.stringify(requestBody));
      return await this.queryService.orderByOffsetLimit(requestBody,
        this.queryService.filterNewerThan(requestBody,
          this.queryService.filterOlderThan(requestBody,
            this.queryService.filterCategory(requestBody,
              this.queryService.populateFields(Bid.populateable(), requestBody,
                this.queryService.filterOwnerProfile(requestBody, this.bidModel.find({ mission: { _id: mission._id } })
                ))))));
    } catch (exception) {
      this.logger.error("BidService", "Error while fetching bids by mission: "+mission._id.toString()+" requestBody: "+JSON.stringify(requestBody),exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching" };
    }
  };

  /**
  * Creates a campaign from request, and returns the object or validation error response if invalid
  */
  async create(body: BidIF, profile: ProfileIF) {
    this.logger.info("BidService", "Creating new bid. owner: "+profile._id.toString());
    let err, mission: MissionIF, bid_saved: BidIF, canBid: boolean, has_bid_before: boolean;
    const post_logic = async (bid: BidIF, mission: MissionIF) => {
      this.logger.info("BidService", "doing post-processing for bid: "+bid._id.toString());
      try {
        this.logger.info("BidService", "Creating event for bid: "+bid._id.toString());
        await this.eventService.create(new Event("Bid", EventKey.BID_RECEIVED, bid._id, [bid.owner_profile._id, mission.owner_profile._id], mission._id, "Mission"));
      } catch (exception) {
        this.logger.error("BidService", "Error creating event for bid: "+bid._id.toString()+". bid-body: "+JSON.stringify(body),exception);
        throw exception.code ? exception : { code: 500, message: "Error while creating event in post-logic" };
      }
    };
    // fetch mission:
    this.logger.info("BidService", "Fetching mission by id: "+body.mission);
    [err, mission] = await to(this.missionService.fetchById(body.mission));
    if (err) {
      this.logger.error("BidService", "Error fetching mission: "+body.mission, err);
      throw err.code ? err : { code: 404, message: "Error while fetching mission." };
    }
    if (!mission) {
      this.logger.error("BidService", "Mission not found (mission variable is empty): "+body.mission);
      throw { code: 404, message: "Mission not found" }
    }
    // check pre-conditions:
    if (!mission.active) {
      this.logger.error("BidService", "Mission not active: "+body.mission);
      throw { code: 404, message: "Mission is not active" };
    }
    [err, has_bid_before] = await to(this.hasBid(profile, mission, BidStatus.PENDING));
    if (err){
      this.logger.error("BidService", "Error during this.hasBid (checking if already bid before). Profile: "+profile._id+", Mission: "+mission._id, err);
      throw err.code ? err : {code: 500, message: "Error while checking if already bid before"}}
    if (has_bid_before){
      this.logger.info("BidService", "Already bid, aborting. Profile: "+profile._id+", Mission: "+mission._id);
      throw {code: 403, message: "Bid is already placed. Can only bid once. Delete or reject existing bid before placing a new one"}
    }
    [err, canBid] = await to(this.bidChecker.canBid(profile, mission));
    if (err) {
      throw err.code ? err : { code: 404, message: "Error while checking bid" };
    }
    if (!canBid) {
       throw { code: 403, message: "Cant bid. (same owner-user?)" };
    }
    // create and store bid
    const bid = new this.bidModel(body);
    bid.owner_profile = profile._id;
    bid.participants = [profile._id, mission.owner_profile._id];
    console.log(bid.participants);
    [err, bid_saved] = await to(bid.save());
    if (err) {
      throw err.code ? err : { code: 500, message: "Error while saving bid" };
    }
    mission.bids.push(bid_saved._id); // attach bid to mission
    [err] = await to(mission.save());
    if (err) {
      throw err.code ? err : { code: 500, message: "Error while saving mission" };
    }
    [err] = await to(post_logic(bid_saved, mission));
    if (err) {
      throw err.code ? err : { code: 500, message: "Error during post-logic" };
    }
    return bid_saved;
  }

  /**
   * Checks if the given profile has placed a bid on the mission before
   * @param profile 
   * @param mission 
   */
  async hasBid(profile: ProfileIF, mission: MissionIF, status?: BidStatus): Promise<boolean> {
    try {
      return (await this.queryService.filterOwnerProfile({ owner_id: profile._id },
        this.bidModel.find({ mission: { _id: mission._id } , status: status})).limit(1)).length > 0;
    } catch (exception) {
      console.log(exception);
      throw exception.code ? exception : { code: 500, message: "Errror while fetching bids to check if already bid" }
    }
  }

  async changeStatus(bid: BidIF, new_status: BidStatus) {
    let err,
      bid_saved: BidIF,
      can_change: boolean,
      bid_item: ItemIF,
      bid_owner_profile: ProfileIF,
      mission: MissionIF;
    const on_logic_complete = async (bid: BidIF, mission: MissionIF, item: ItemIF) => {
      [err] = await to(this.eventService.create(new Event("Bid", new_status == BidStatus.ACCEPTED ? EventKey.BID_ACCEPTED : EventKey.BID_REJECTED, bid._id, [bid.owner_profile, mission.owner_profile], mission._id, "Mission")));
      if (err) { throw err.code ? err : { code: 500, message: "Error during post-logic: Creating event" } }
    };
    // --- PRE-CONDITIONS:
    if (new_status == BidStatus.PENDING) {
      throw { code: 403, message: "Cant set status to PENDING. Only ACCEPTED or REJECTED allowed" };
    }
    [err, mission] = await to(this.missionService.fetchById(bid.mission._id));
    if (err) { throw err.code ? err : { code: 500, message: "Error when fetching mission" } };
    if (!mission) { throw { code: 404, message: "Mission not found from bid" } }
    [err, can_change] = await to(this.bidChecker.canChange(bid, mission));
    if (err) {
      throw err.code ? err : { code: 500, message: "Error while checking if bid status can be changed by profile for mission" };
    }
    if (!can_change) {
      throw { code: 403, message: "Bid status of " + bid.status + " cant be chnaged. Bid already accepted to rejected" };
    }
    [err, bid_owner_profile] = await to(this.profileService.fetchById(bid.owner_profile._id));
    if (err) { throw err.code ? err : { code: 404, message: "Error while fetching owner-profile of bid" } };
    if (!bid_owner_profile) { throw { code: 404, message: "Bid owner-profile not found" } };
    // --- STORE CHANGES:
    // mark as accepted:
    bid.status = new_status; // set new bid status
    mission.active = false; // mission is now concluded, deactivate
    [err, bid_saved] = await to(bid.save());
    if (err) { throw err.code ? err : { code: 500, message: "Error while saving mission" } };
    // create item for mission (so the item can be bought by mision owner):
    if (new_status == BidStatus.ACCEPTED) {
      const item: ItemIF = this.itemService.generateItemFromBid(mission, bid);
      [err, bid_item] = await to(this.itemService.create(item, bid_owner_profile));
      if (err) { throw err.code ? err : { code: 500, message: "Error while saving item for accepted bid" } };
    }
    [err] = await to(on_logic_complete(bid, mission, bid_item));
    if (err) { throw err.code ? err : { code: 500, message: "Error during post-logic" } };
    return (new_status == BidStatus.ACCEPTED) ? { // resolve with accepted bid, generated item and order (to be paid)
      bid: bid_saved,
      item: bid_item
    } : bid;
  }

  /**
   * Deletes a given bid by id
   * @param bid 
   */
  async delete(profile: ProfileIF, bid: BidIF) {
    let err, mission: MissionIF;
    if (!this.generalModelService.profileCanEditObj(profile, bid)) { throw { code: 401, message: "Unauthorized" } } // check access
    [err, mission] = await to(this.missionService.fetchById(bid.mission._id)); // fetch mission from bid
    if (err) { throw err.code ? err : { code: 500, message: "Error whhile fetching mission from bid" } }
    if (!mission) { throw { code: 404, message: "Mission from bid not found" } }
    if (!mission.active) { throw { code: 403, message: "Mission from bid not active" } }
    if (bid.status == BidStatus.ACCEPTED) { throw { code: 403, message: "Bid is accepted and cant be deleted" } }
    [err] = await to(this.bidModel.deleteOne({ _id: bid._id }));
    if (err) { throw { code: 500, message: "Error while deleting bid" } };
    return "success";
  }

}