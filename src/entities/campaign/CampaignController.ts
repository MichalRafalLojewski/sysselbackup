import CampaignService from "./CampaignService";
import ItemService from "../item/ItemService";
import Responses from "../../general/consts/Responses";
import GeneralModelService from "../../general/services/GeneralModelService";
import ResponseService from "../../general/services/ResponseService";
import CampaignIF from "./CampaignIF";
import ItemIF from "../item/ItemIF";
import RequestOutIF from "../RequestOutIF";

/**
* Controller module for user-related requests.
* contains controller-functions which are mapped to by campaign-related routes
*/
export default class CampaignController // TODO: REPLACE itemModel REFERENCE WITH CALL TO this.itemService.findById
{
  private campaignService: CampaignService;
  private itemService: ItemService;
  private responses: Responses;
  private responseService: ResponseService;
  private generalModelService: GeneralModelService;

  constructor(campaignService: CampaignService, itemService: ItemService, responses: Responses, generalModelService: GeneralModelService, responseService: ResponseService) {
    this.campaignService = campaignService;
    this.itemService = itemService;
    this.responses = responses;
    this.responseService = responseService;
    this.generalModelService = generalModelService;
  }

  /**
  * Creates a campaign from request, and returns the object or validation error response if invalid
  */
  async create(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (campaign) => me.responseService.respond(res, 200, campaign);
    me.campaignService.create(req.body, req.profile).then(ok).catch(anyErr);
  };

  /**
  * Updates a given campaign with values from request
  */
  async update(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (campaign: CampaignIF) => this.responseService.respond(res, 200, campaign);
    let campaign: CampaignIF;
    try {
      campaign = await this.campaignService.fetchById(req.body._id);
    } catch (exception) {
      return exception.code ? anyErr(exception) : anyErr({ code: 404, message: "Campaign not found" });
    }
    if (!campaign) {
      return anyErr({ code: 404, message: "Campaign not found" });
    }
    if (req.body.active) // special case for active (not automatically casting from json string to boolean, thus handle below...)
    {
      req.body.active = (req.body.active + "" == "true"); // prevent casting error
    }
    this.campaignService.update(campaign, req.profile, req.body).then(ok).catch(anyErr);
  };

  /**
  * Fetches all campaigns that match given search criteria
  * TODO: Add restrictions that limit must be set to a reasonable amount to avoid too many results
  */
  async fetchAny(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (campaigns: CampaignIF[]) => this.responseService.respond(res, 200, campaigns);
    this.campaignService.fetchAny(req.profile, req.query).then(ok).catch(anyErr);
  };

  /**
  * Fetches a given campaign by id
  */
  async fetchById(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (campaign: CampaignIF) => this.responseService.respond(res, 200, campaign);
    let campaign: CampaignIF;
    try {
      campaign = await this.campaignService.fetchById(req.params.id, req.query);
    } catch (exception) {
      if (exception.code) {
        return anyErr(exception);
      }
      return anyErr({ code: 404, message: "Campaign not found" });
    }
    if (!campaign) {
      return anyErr({ code: 404, message: "Campaign not found" });
    }
    if (!(campaign.active || (req.profile && this.generalModelService.profileCanEditObj(req.profile, campaign)))) // if campaign active, allow anyone to view, else, check if user has edit privliges
    {
      return anyErr({ code: 401, message: this.responses.unathorized });
    }
    ok(campaign);
  }

  /**
  * Assigns a list of items to a given campaign owned by current profile
  */
  async assignItems(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (result) => this.responseService.respond(res, 200, result);
    let campaign: CampaignIF;
    let items: ItemIF[];
    try {
      campaign = await this.campaignService.fetchById(req.body.campaign_id);
    } catch (exception) {
      if (exception.code) {
        return anyErr(exception);
      }
      return anyErr({ code: 404, message: "Campaign not found" });
    }
    if (!campaign) {
      return anyErr({ code: 404, message: "Campaign not found" });
    }
    try {
      items = await this.itemService.fetchMultipleById(req.body.item_ids);
      if (req.body.item_ids.length > items.length) {
        return anyErr({ code: 404, message: "Some items were not found" });
      }
    } catch (exception) {
      if (exception.code) {
        return anyErr(exception);
      }
      return anyErr({ code: 404, message: "Some items were not found" });
    }
    this.campaignService.assignItems(req.profile, campaign, items).then(ok).catch(anyErr);
  }

  async removeItems(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (message) => this.responseService.respond(res, 200, { message: message });
    let campaign: CampaignIF;
    try {
      campaign = await this.campaignService.fetchById(req.body.campaign_id);
    } catch (exception) {
      if (exception.code) {
        return anyErr(exception);
      }
      return anyErr({ code: 404, message: "Campaign not found" });
    }
    this.campaignService.removeItems(req.profile, campaign, req.body.item_ids).then(ok).catch(anyErr);
  }

  /**
  * Fetches all campaigns from a given profile (by id)
  * offers order by, limit, offset
  */
  async fetchByProfile(req, res) {
      const anyErr = (response: RequestOutIF) => this.responseService.respond(res, 404, { message: response.message }),
      ok = (campaigns: CampaignIF[]) => this.responseService.respond(res, 200, campaigns);
    this.campaignService.fetchByProfile(req.profile, req.query).then(ok).catch(anyErr);
  };

  /**
  * Deletes a given campaign by id
  * NOTE: Might be improved... fetches the given model twice from db... complexity might also be reduced
  */
  async delete(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = () => this.responseService.respond(res, 200, { message: this.responses.success });
    let campaign: CampaignIF;
    try {
      campaign = await this.campaignService.fetchById(req.params.id);
      if (!campaign) { return anyErr({ code: 404, message: "Not found" }) }
    } catch (exception) {
      if (exception.code) {
        return anyErr(exception);
      }
      return anyErr({ code: 404, message: "Not found" });
    }
    // success, user owns campaign, delete it:
    this.campaignService.deleteById(campaign._id, req.profile).then(ok).catch(anyErr);
  };

  /**
  * Fetches campaigns from profiles that the current profile subscribes to
  */
  async fetchSubscriptionCampaigns(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (campaigns: CampaignIF[]) => this.responseService.respond(res, 200, campaigns);
    this.campaignService.fetchSubscriptionCampaigns(req.profile, req.query).then(ok).catch(anyErr);
  };

};
