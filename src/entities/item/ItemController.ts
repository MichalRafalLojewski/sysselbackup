import ItemService from "./ItemService";
import CampaignService from "../campaign/CampaignService";
import ProfileService from "../profile/ProfileService";
import ItemOptionsService from "../itemOptions/ItemOptionsService";
import Responses from "../../general/consts/Responses";
import ResponseService from "../../general/services/ResponseService";
import GeneralModelService from "../../general/services/GeneralModelService";
import ItemIF from "./ItemIF";
import ItemOptionsIF from "../itemOptions/ItemOptionsIF";
import CampaignIF from "../campaign/CampaignIF";
import ProfileIF from "../profile/ProfileIF";
import RequestOutIF from "../RequestOutIF";
import { FetchAllItemsOutDTO } from "./DTOs/FetchItemsDTO";

/**
* Controller module for item-related requests.
*/
export default class ItemController {
  private itemService: ItemService;
  private campaignService: CampaignService;
  private profileService: ProfileService;
  private itemOptionsService: ItemOptionsService;
  private responses: Responses;
  private responseService: ResponseService;
  private generalModelService: GeneralModelService;

  constructor(itemService: ItemService, campaignService: CampaignService, profileService: ProfileService, itemOptionsService: ItemOptionsService, responses: Responses, responseService: ResponseService, generalModelService: GeneralModelService) {
    this.itemService = itemService;
    this.campaignService = campaignService;
    this.profileService = profileService;
    this.itemOptionsService = itemOptionsService;
    this.responses = responses;
    this.responseService = responseService;
    this.generalModelService = generalModelService;
  }

  /**
* Creates an item from request, and returns the object or validation error response if invalid
*/
  create(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (item: ItemIF) => me.responseService.respond(res, 200, item);
      me.itemService.create(req.body, req.profile).then(ok).catch(anyErr);
  };

  /**
  * Updates a given item with values from request
  */
  update(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (item: ItemIF) => me.responseService.respond(res, 200, item);
    me.itemService.fetchById(req.body._id).then(function (item: ItemIF) {
      if (!item) {
        return anyErr({ code: 404, message: "Not found" });
      }

      if (req.body.active) // special case for active(not automatically casting from json string to boolean, thus handle below...)
      {
        req.body.active = (req.body.active + "" == "true"); // prevent casting error
      }
      me.itemService.update(item, req.profile, req.body).then(ok).catch(anyErr);
    }).catch(anyErr);
  };

  /**
  * Fetches a given item by id
  */
  fetchById(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (item: ItemIF) => me.responseService.respond(res, 200, item);
    me.itemService.fetchById(req.params.id, req.query).then(function (item: ItemIF) {
      if (!item) {
        return anyErr({ code: 404, message: "Not found" });
      }
      if (!(item && (item.active || (req.profile && me.generalModelService.profileCanEditObj(req.profile, item))))) // if campaign active, allow anyone to view, else, check if user has edit privliges
      {
        return anyErr({ code: 401, message: "Unauthorized" });
      }
      ok(item);
    }).catch(anyErr);
  };

  /**
  * Fetches all items from a given campaign(by id)
  * offers order by, limit, offset
  */
  fetchByCampaign(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (items: ItemIF[]) => me.responseService.respond(res, 200, items);
    me.campaignService.fetchById(req.query.id).then(function (campaign: CampaignIF) {
      if (!campaign) {
        return anyErr({ code: 404, message: "Not found" });
      }
      if (!(campaign.active || (req.profile && me.generalModelService.profileCanEditObj(req.profile, campaign)))) {
        return anyErr({ code: 401, message: "Unauthorized" });
      }
      if (!(req.profile && (req.profile._id.toString() == campaign.owner_profile._id.toString()))) {
        req.query.active = true;
        req.query.listed = true;
      }
      me.itemService.fetchByCampaign(campaign, req.query).then(ok).catch(anyErr);
    }).catch(anyErr);
  };

  /**
* Fetches items from profiles that the current user subscribes to
*/
  fetchSubscriptionItems(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (items: ItemIF[]) => this.responseService.respond(res, 200, items);
    this.itemService.fetchSubscriptionItems(req.profile, req.query).then(ok).catch(anyErr);
  };

  /**
  * Fetches any (suggested) items
  */
  fetchAny(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (items: FetchAllItemsOutDTO) => this.responseService.respond(res, 200, items);
    this.itemService.fetchAny(req.profile, req.query).then(ok).catch(anyErr);
  };

  /**
  * Fetches all items from a given profile
  */
  fetchByProfile(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (items: ItemIF[]) => me.responseService.respond(res, 200, items);
    me.profileService.fetchById(req.query.id).then(function (prof: ProfileIF) {
      if (!prof) {
        return anyErr({ code: 404, message: "Profile not found" });
      }
      if (!(req.profile && (req.profile._id.toString() == prof._id.toString()))) {
        req.query.active = true;
        req.query.listed = true;
      }
      me.itemService.fetchByProfile(prof, req.query).then(ok).catch(anyErr);
    }).catch(anyErr);
  };

  /**
  * Fetches multiple items from id-array
  */
  fetchByIds(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (items: ItemIF[]) => this.responseService.respond(res, 200, items);
    this.itemService.fetchByIds(req.query.item_ids, req.profile, req.query).then(ok).catch(anyErr);
  };

  /**
  * Deletes a given item by id
  */
  deleteById(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = () => this.responseService.respond(res, 200, { message: this.responses.success });
    this.itemService.deleteById(req.params.id, req.profile).then(ok).catch(anyErr);
  }

};
