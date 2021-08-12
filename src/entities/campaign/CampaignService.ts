import ProfileSubscriptionService from "../profileSubscription/ProfileSubscriptionService";
import QueryService from "../../general/services/QueryService";
import CampaignIF from "./CampaignIF";
import ProfileIF from "../profile/ProfileIF";
import ItemIF from "../item/ItemIF";
import ProfileSubscriptionIF from "../profileSubscription/ProfileSubscriptionIF";
import Campaign from "./Campaign";
import Responses from "../../general/consts/Responses";
import GeneralModelService from "../../general/services/GeneralModelService";
import FileService from "../file/FileService";
import FileIF from "../file/FileIF";
import to from 'await-to-js';
import LoggerIF from "../../general/loggers/LoggerIF";

export default class CampaignService {
  private campaignModel;
  private profileSubscriptionService: ProfileSubscriptionService;
  private queryService: QueryService;
  private responses: Responses;
  private generalModelService: GeneralModelService;
  private fileService: FileService;
  private logger: LoggerIF;

  constructor(campaignModel, profileSubscriptionService: ProfileSubscriptionService, queryService: QueryService, responses: Responses, generalModelService: GeneralModelService, fileService: FileService, logger: LoggerIF) {
    this.campaignModel = campaignModel;
    this.profileSubscriptionService = profileSubscriptionService;
    this.queryService = queryService;
    this.responses = responses;
    this.generalModelService = generalModelService;
    this.fileService = fileService;
    this.logger = logger;
  }

  /**
  * Fetches a given campaign by id
  */
  async fetchById(id, requestBody: any = {}) {
    try {
      return await this.queryService.populateFields(Campaign.populateable(), requestBody, this.campaignModel.findOne({ _id: id }));
    } catch (exception) {
      throw exception.code ? exception : { code: 500, message: "Erro while fetching campaign" };
    }
  }

  /**
   * Checks if the given object is a campaign
   */
  isCampaign(obj): boolean {
    return obj instanceof this.campaignModel;
  }

  /**
  * Fetches all campaigns from a given profile (by id)
  * offers order by, limit, offset
  */
  async fetchByProfile(profile: ProfileIF, requestBody: any = {}) {
    let query = null;
    try {
      if (profile && requestBody.owner_id && (profile._id.toString() == (requestBody.owner_id))) // check if filter by current profile
      {
        query = this.campaignModel.find({});
      } else {
        query = this.queryService.filterActive(requestBody,
          this.campaignModel.find({}));
      }
      return await this.queryService.orderByOffsetLimit(requestBody,
        this.queryService.filterSearch('title', requestBody,
          this.queryService.filterNewerThan(requestBody,
            this.queryService.filterOlderThan(requestBody,
              this.queryService.filterCategory(requestBody,
                this.queryService.filterNear(requestBody,
                  this.queryService.populateFields(Campaign.populateable(), requestBody,
                    this.queryService.filterOwnerProfile(requestBody, query)
                  )))))));
    } catch (exception) {
      throw exception.code ? exception : { code: 500, message: "Error while fetching" }
    }
  };

  /**
* Fetches all campaigns that match given search criteria
* TODO: Add restrictions that limit must be set to a reasonable amount to avoid too many results
*/
  async fetchAny(current_profile: ProfileIF, requestBody) {
    try {
      return await this.queryService.orderByOffsetLimit(requestBody,
        this.queryService.filterActive(requestBody,
          this.queryService.filterListed(requestBody,
            this.queryService.filterSearch('title', requestBody,
              this.queryService.filterNewerThan(requestBody,
                this.queryService.filterOlderThan(requestBody,
                  this.queryService.filterCategory(requestBody,
                    this.queryService.filterNear(requestBody,
                      this.queryService.filterOwnerProfile(requestBody, 
                        this.queryService.filterOwnerUser(requestBody, 
                      this.queryService.populateFields(Campaign.populateable(), requestBody,
                        this.campaignModel.find({})
                      )))))))))));
    } catch (exception) {
      this.logger.error("Error applying filters. Current profile: "+current_profile._id.toString(), exception);
      if (exception.code) {
        throw exception;
      }
      throw { code: 500, message: "Error while applying filters" };
    }
  };

  /**
   * Fetches campaigns from profiles that the given profile subscribes to
   */
  async fetchSubscriptionCampaigns(profile: ProfileIF, requestBody) {
    let subscriptions: ProfileSubscriptionIF[];
    let profileIds: any[];
    try {
      subscriptions = await this.profileSubscriptionService.fetchBySubscriber(profile, {}); // WARNING: POTENTIAL MEMORY HOG. LOADS ALL SUBSCRIPTIONS OF GIVEN PROFILE INTO MEMORY
      profileIds = subscriptions.map(function (subscription: ProfileSubscriptionIF) {
        return subscription.subscribe_to;
      });
    } catch (exception) {
      throw { code: 500, message: "Error while fetching subcriptions" };
    }
    try {
      // find campaigns:
      return await this.queryService.orderByOffsetLimit(requestBody,
        this.queryService.filterCategory(requestBody,
          this.queryService.filterSearch('title', requestBody,
            this.queryService.filterActive(requestBody,
              this.queryService.filterListed(requestBody,
                this.queryService.filterNewerThan(requestBody,
                  this.queryService.filterOlderThan(requestBody,
                    this.queryService.filterNear(requestBody,
                      this.queryService.filterOwnerProfile(requestBody, 
                        this.queryService.filterOwnerUser(requestBody, 
                      this.queryService.populateFields(Campaign.populateable(), requestBody,
                        this.campaignModel.find({}).where('owner_profile').in(profileIds)
                      )))))))))));
    } catch (exception) {
      this.logger.error("Error applying filters. Current profile: "+profile._id.toString(), exception);
      throw exception.copde ? exception : { code: 500, message: "Error while applying filters and fetching from db" };
    }
  };


  /**
  * Creates a campaign from request, and returns the object or validation error response if invalid
  */
  async create(campaign_body: CampaignIF, profile: ProfileIF) {
    let err, campaign_saved: CampaignIF;
    const post_logic = async (profile: ProfileIF, campaign_saved: CampaignIF) => {
      // increment profiles item-count:
      try {
        this.logger.info("CampaignService", "Performing post-logic after campaign-create on campaign: " + campaign_saved._id);
        profile.number_of_campaigns++;
        await profile.save();
      } catch (exception) {
        this.logger.error("CampaignService", "Exception saving profile after post-logic. Request-Body: \n" + JSON.stringify(campaign_body), exception);
        throw exception.code ? exception : { code: 500, message: "Error while saving post-logic on campaign create" }
      }
    };
    // create and store campaign
    const campaign: CampaignIF = new this.campaignModel(campaign_body);
    campaign.owner_profile = profile._id;
    campaign.owner_user = profile.owner._id;
    campaign.location = profile.location;
    this.logger.info("CampaignService", "Saving campaign to db");
    [err, campaign_saved] = await to(campaign.save());
    if (err) {
      this.logger.error("CampaignService", "Exception saving campaign. Request-Body: \n" + JSON.stringify(campaign_body), err);
      throw err.code ? err : { code: 500, message: "Error while saving campaign" }
    }
    [err] = await to(post_logic(profile, campaign_saved));
    if (err) { throw err.code ? err : { code: 500, message: "Error while performing post-logic" } }
    return campaign_saved;
  }

  /**
   * Updates a given campaign
   */
  async update(campaign: CampaignIF, profile: ProfileIF, newBody) {
    let err, campaign_saved: CampaignIF;
    const post_logic = async (profile: ProfileIF, obj_old: CampaignIF, obj_new: CampaignIF) => {
      this.logger.info("CampaignService", "Performing post-logic after campaign-update");
      this.logger.info("CampaignService", "Deleting orpahned files from campaign: " + campaign._id);
      let deleted_orphaned_files: string[];
      // delete removed pictures:
      [err, deleted_orphaned_files] = await to(this.fileService.deleteOrpahnedFiles(profile, obj_old, obj_new));
      if (err) {
        this.logger.error("CampaignService", "Exception deleting orphaned files duirng post logic (via fileService.deleteOrpahnedFiles). Request-Body: \n" + JSON.stringify(campaign), err);
        throw err.code ? err : { code: 500, message: "Error while deleting orphaned files during post-logic" }
      }
      this.logger.info("CampaignService", "Deleted orpahned files: [" + deleted_orphaned_files + "] (length: " + deleted_orphaned_files.length + ") from campaign: " + campaign._id);
    }
    // check permissions:
    if (!this.generalModelService.profileCanEditObj(profile, campaign)) {
      throw { code: 401, message: this.responses.unathorized };
    }
    this.logger.info("CampaignService", "Updating campaign " + campaign._id + " in db");
    [err] = await to(this.campaignModel.updateOne({ _id: campaign._id }, newBody));
    if (err) {
      this.logger.error("CampaignService", "Exception while updating campaign " + campaign._id + ". Request-Body: \n" + JSON.stringify(campaign), err);
      throw err.code ? err : { code: 500, message: "Error while updating campaign" }
    }
    [err, campaign_saved] = await to(this.fetchById(campaign._id));
    if (err) {
      this.logger.error("CampaignService", "Exception while fetching campaign " + campaign._id + " after update", err);
      throw err.code ? err : { code: 500, message: "Error while fetching campaign after update" }
    }
    [err] = await to(post_logic(profile, campaign, campaign_saved));
    if (err) { throw err.code ? err : { code: 500, message: "Error during post-logic" } }
    return campaign_saved;
  };

  /**
  * Deletes a given campaign by id
  */
  async deleteById(campaignId, profile: ProfileIF) {
    let err, campaign: CampaignIF;
    const delete_files = async (profile: ProfileIF, obj_old: CampaignIF) => {
      let err, files: FileIF[];
      this.logger.info("CampaignService", "Deleting files attached to deleted campaign " + campaign._id + "");
      if (obj_old.other_pics && obj_old.other_pics.length > 0) {
        [err, files] = await this.fileService.fetchByIds(obj_old.other_pics.map(pic => pic._id));
        if (err) {
          this.logger.error("CampaignService", "Exception while fetching other_pics before deleting for campaign" + campaign._id, err);
          throw err.code ? err : { code: 500, message: "Error while fetching other_pics before deleting" }
        }
        [err] = await to(this.fileService.deleteMultiple(profile, files));
        if (err) {
          this.logger.error("CampaignService", "Exception while deleting other_pics for campaign" + campaign._id, err);
          throw err.code ? err : { code: 500, message: "Error while deleting other_pics: [" + files.map(file => file._id) + "]" }
        }
        this.logger.info("CampaignService", "Deleted orpahned files: [" + files.map(file => file._id) + "] (length: " + files.length + ") from campaign: " + campaign._id);

      }
      if (obj_old.front_pic) {
        const front_pic: FileIF = await this.fileService.fetchById(obj_old.front_pic._id);
        [err] = await to(this.fileService.delete(profile, front_pic));
        if (err) {
          this.logger.error("CampaignService", "Exception while deleting front_pic: " + front_pic._id + " for campaign " + campaign._id, err);
          throw err.code ? err : { code: 500, message: "Error while deleting front_pic" }
        }
      }
    },
      post_logic = async (profile: ProfileIF) => {
        this.logger.info("CampaignService", "Performing post-logic after deleting campaign " + campaign._id + "");
        // increment profiles item-count:
        try {
          profile.number_of_campaigns--;
          await profile.save();
        } catch (exception) {
          this.logger.error("CampaignService", "Exception during post-logic while deleting campaign" + campaign._id, exception);
          throw { code: 500, message: "Error during post-procedure for delete" };
        }
      };
    // business-logic:
    [err, campaign] = await to(this.fetchById(campaignId));
    if (err) {
      this.logger.error("CampaignService", "Exception while fetching campaign" + campaign._id, err);
      throw err.code ? err : { code: 500, message: "Error while fetching campaign" }
    };
    if (!campaign) { throw { code: 404, message: "Not found" } };
    if (!this.generalModelService.profileCanEditObj(profile, campaign)) {
      throw { code: 401, message: this.responses.unathorized };
    }
    [err] = await to(this.campaignModel.deleteOne({ _id: campaign._id }));
    if (err) {
      this.logger.error("CampaignService", "Exception while deleting campaign" + campaign._id, err);
      throw err.code ? err : { code: 500, message: "Error while deleting campaign" }
    };
    try {
      await Promise.all([post_logic(profile), delete_files(profile, campaign)]);
    } catch (exception) {
      throw exception.code ? exception : { code: 500, message: "Error during post-logic and/or deleting related files" };
    }
    return true;
  }

  /**
   * Assigns a list of items to a given campaign
   */
  async assignItems(profile: ProfileIF, campaign: CampaignIF, items: ItemIF[]) {
    this.logger.info("CampaignService", "Assigning items: [" + items.map(item => item._id) + "] to campaign: " + campaign._id);
    if (!this.generalModelService.profileCanEditObj(profile, campaign)) {
      this.logger.security("CampaignService", "Profile does not have edit rights to campaign. Profile:" + profile._id + ", Campaign: " + campaign._id);
      throw { code: 401, message: this.responses.unathorized };
    }
    const ok = items.filter(item => this.generalModelService.profileCanEditObj(profile, item)).map(item => item._id); // allow only items the given profile can edit
    if (ok.length < items.length) {
      this.logger.security("CampaignService", "Profile does not have edit rights to some of the items during assignItems. Profile:" + profile._id + ", Campaign: " + campaign._id);
      throw { code: 401, message: "Profile does not have edit rights to some of the items" };
    }
    if (!campaign.items) {
      campaign.items = []
    }
    const to_add = ok.filter(item => !campaign.items.includes(item));
    campaign.items = campaign.items.concat(to_add);
    try {
      await campaign.save();
    } catch (exception) {
      this.logger.error("CampaignService", "Exception while saving campaign after assigning items" + campaign._id, exception);
      throw exception.code ? exception : { code: 500, message: "Error while saving campaign" };
    }
    return { added: to_add, ignored: ok.filter(item => !to_add.includes(item)) };
  }

  /**
   * Removes the given items from the campaign
   * @param profile 
   * @param campaign 
   * @param item_ids 
   */
  async removeItems(profile: ProfileIF, campaign: CampaignIF, item_ids: any[]) {
    this.logger.info("CampaignService", "Removing items: [" + item_ids + "] to campaign: " + campaign._id);
    if (!this.generalModelService.profileCanEditObj(profile, campaign)) {
      this.logger.security("CampaignService", "Profile does not have edit rights to campaign. Profile:" + profile._id + ", Campaign: " + campaign._id);
      throw { code: 401, message: "Unauthorized" };
    }
    campaign.items = campaign.items.filter((item) => !(item_ids.includes(item._id.toString())));
    try {
      await campaign.save();
    } catch (exception) {
      this.logger.error("CampaignService", "Exception while saving campaign after removing items" + campaign._id, exception);
      throw exception.code ? exception : { code: 500, message: "Error while saving campaign" };
    }
    return "success";
  }

}