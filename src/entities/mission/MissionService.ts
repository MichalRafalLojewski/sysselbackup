import MissionIF from "./MissionIF";
import ProfileIF from "../profile/ProfileIF";
import QueryService from "../../general/services/QueryService";
import Mission from "./Mission";
import ProfileSubscriptionService from "../profileSubscription/ProfileSubscriptionService";
import ProfileSubscriptionIF from "../profileSubscription/ProfileSubscriptionIF";
import FileService from "../file/FileService";
import GeneralModelService from "../../general/services/GeneralModelService";
import Responses from "../../general/consts/Responses";
import FileIF from "../file/FileIF";
import to from 'await-to-js';
import LoggerIF from "../../general/loggers/LoggerIF";

export default class MissionService {

  private missionModel;
  private queryService: QueryService;
  private profileSubscriptionService: ProfileSubscriptionService;
  private fileService: FileService;
  private generalModelService: GeneralModelService;
  private responses: Responses;
  private logger: LoggerIF;

  constructor(missionModel, queryService: QueryService, profileSubscriptionService: ProfileSubscriptionService, fileService: FileService, generalModelService: GeneralModelService, responses: Responses, logger: LoggerIF) {
    this.missionModel = missionModel;
    this.queryService = queryService;
    this.profileSubscriptionService = profileSubscriptionService;
    this.fileService = fileService;
    this.generalModelService = generalModelService;
    this.responses = responses;
    this.logger = logger;
  }

  /**
  * Checks if the given object is a mission
  */
  isMission(obj): boolean {
    return obj instanceof this.missionModel;
  }

  /**
 * Fetches a given mission by id
 */
  async fetchById(id, requestBody: any = {}): Promise<MissionIF> {
    this.logger.info("MissionService", "Fetching mission by id: " + id);
    try {
      return await this.queryService.populateFields(Mission.populateable(), requestBody, this.missionModel.findOne({ _id: id }));
    } catch (exception) {
      this.logger.error("MissionService", "Exception fetching", exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching" };
    }
  }

  /**
* Fetches all missions from a given profile (by id)
* NOTE: Profile-id from requestBody. 
* offers order by, limit, offset
*/
  async fetchByProfile(requestBody, current_profile?: ProfileIF) {
    this.logger.info("MissionService", "Fetching missions by profile: " + current_profile._id);
    let query = null;
    if (current_profile && (current_profile._id.toString() == (requestBody.owner_id))) // check if filter by current profile
    {
      query = this.missionModel.find({});
    } else {
      query = this.queryService.filterActive(requestBody,
        this.missionModel.find({}));
    }
    try {
      return await this.queryService.orderByOffsetLimit(requestBody,
        this.queryService.filterSearch('title', requestBody,
          this.queryService.filterNewerThan(requestBody,
            this.queryService.filterOlderThan(requestBody,
              this.queryService.filterListed_optional(requestBody,
                this.queryService.filterCategory(requestBody,
                  this.queryService.filterNear(requestBody,
                    this.queryService.populateFields(Mission.populateable(), requestBody,
                      this.queryService.filterOwnerProfile(requestBody, query)
                    ))))))));
    } catch (exception) {
      this.logger.error("MissionService", "Exception fetching missions by profile", exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching" };
    }
  }

  /**
 * Fetches missions from profiles that the given profile subscribes to
 */
  async fetchSubscriptionMissions(profile: ProfileIF, requestBody) {
    this.logger.info("MissionService", "Fetching missions by subscriptions for profile: " + profile._id);
    let err, subscriptions: ProfileSubscriptionIF[];
    [err, subscriptions] = await to(this.profileSubscriptionService.fetchBySubscriber(profile, {}));
    if (err) {
      this.logger.error("MissionService", "Exception fetching subscription-profiles", err);
      throw err.code ? err : { message: "Error while fetching subscription-profiles" }
    }
    const profileIds = subscriptions.map((subscription: ProfileSubscriptionIF) => subscription.subscribe_to);
    // find campaigns:
    try {
      return await this.queryService.orderByOffsetLimit(requestBody,
        this.queryService.filterCategory(requestBody,
          this.queryService.filterSearch('title', requestBody,
            this.queryService.filterActive(requestBody,
              this.queryService.filterListed(requestBody,
                this.queryService.filterNewerThan(requestBody,
                  this.queryService.filterOlderThan(requestBody,
                    this.queryService.filterNear(requestBody,
                      this.queryService.filterOwnerProfile(requestBody, 
                      this.queryService.populateFields(Mission.populateable(), requestBody,
                        this.missionModel.find({}).where('owner_profile').in(profileIds)
                      ))))))))));
    } catch (exception) {
      this.logger.error("MissionService", "Exception fetching missions by subscriptions", exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching" };
    }
  }

  /**
    * Fetches all missions that match given search criteria
    * TODO: Add restrictions that limit must be set to a reasonable amount to avoid too many results
    */
  async fetchAny(requestBody) {
    this.logger.info("MissionService", "Fetching any missions");
    try {
      return await this.queryService.orderByOffsetLimit(requestBody,
        this.queryService.filterActive(requestBody,
          this.queryService.filterListed(requestBody,
            this.queryService.orderByOffsetLimit(requestBody,
              this.queryService.filterSearch('title', requestBody,
                this.queryService.filterNewerThan(requestBody,
                  this.queryService.filterOlderThan(requestBody,
                    this.queryService.filterCategory(requestBody,
                      this.queryService.filterNear(requestBody,
                        this.queryService.filterOwnerProfile(requestBody, 
                          this.queryService.filterOwnerUser(requestBody, 
                        this.queryService.populateFields(Mission.populateable(), requestBody,
                          this.missionModel.find({})
                        ))))))))))));
    } catch (exception) {
      this.logger.error("MissionService", "Exception fetching any missions", exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching" };
    }
  }

  /**
  * Creates a msision from request, and returns the object or validation error response if invalid
  */
  async create(body: MissionIF, profile: ProfileIF) {
    this.logger.info("MissionService", "Creating new mission. Profile: " + profile._id);
    try {
      if (!body.location) { // default to profiles location
        body.location = profile.location;
      }
      // create and store campaign
      const mission = new this.missionModel(body);
      mission.owner_profile = profile._id; // check auth - current user can post on bahelf of company
      mission.owner_user = profile.owner._id;
      return await mission.save();
    } catch (exception) {
      this.logger.error("MissionService", "Exception saving mission", exception);
      throw exception.code ? exception : { code: 500, message: "Error while saving" };
    }
  }

  /**
   * Updates a given mission
   */
  async update(mission: MissionIF, profile: ProfileIF, newBody) {
    this.logger.info("MissionService", "Updating mission: " + mission._id + ". Profile: " + profile._id);
    let err;
    const post_logic = async (profile: ProfileIF, obj_old: MissionIF, obj_new: MissionIF) => {
      // delete removed pictures:
      let deleted_orphaned_files: string[];
      // delete removed pictures:
      [err, deleted_orphaned_files] = await to(this.fileService.deleteOrpahnedFiles(profile, obj_old, obj_new));
      if (err) {
        this.logger.error("MissionService", "Exception deleting orphaned files", err);
        throw err.code ? err : { code: 500, message: "Error while deleting orphaned files during post-logic" }
      }
      this.logger.info("MissionService", "Deleted orphaned files: " + deleted_orphaned_files);
    }
    // check permissions:
    if (!this.generalModelService.profileCanEditObj(profile, mission)) {
      this.logger.security("MissionService", ">Profile unauthorized to edit mission (profile: " + profile._id + ", mission: " + mission._id + ")");
      throw { code: 401, message: this.responses.unathorized };
    }
    [err] = await to(this.missionModel.updateOne({ _id: mission._id }, newBody));
    if (err) {
      this.logger.error("MissionService", "Exception updating mission in db", err);
      throw err.code ? err : { code: 500, message: "Error while updating" }
    }
    const mission_new = await this.fetchById(mission._id);
    [err] = await to(post_logic(profile, mission, mission_new));
    if (err) {
      this.logger.error("MissionService", "Exception during post-logic", err);
      throw err.code ? err : { code: 500, message: "Error during post-logic" }
    }
    return mission_new;
  };

  /**
 * Deletes a given mission by id
 */
  async deleteById(missionId, profile: ProfileIF) {
    this.logger.info("MissionService", "Deleting mission by id: " + missionId._id + ". Profile: " + profile._id);
    let err, files: FileIF[], front_pic: FileIF, msission: MissionIF;
    const delete_files = async (profile: ProfileIF, obj_old: MissionIF) => {
      this.logger.info("MissionService", "Deleting attached files");
      if (obj_old.other_pics && obj_old.other_pics.length > 0) {
        this.logger.info("MissionService", "Deleting other_pics");
        [err, files] = await to(this.fileService.fetchByIds(obj_old.other_pics.map(pic => pic._id)));
        if (err) {
          this.logger.error("MissionService", "Exception while fetching other_pics: [" + obj_old.other_pics.map(pic => pic._id) + "]", err);
          throw err.code ? err : { code: 500, message: "Error while fetching other_pics" }
        }
        [err] = await to(this.fileService.deleteMultiple(profile, files));
        if (err) {
          this.logger.info("MissionService", "Exception deleting other_pics", err);
          throw err.code ? err : { code: 500, message: "Error while deleting other_pics" }
        }
      }
      if (obj_old.front_pic) {
        this.logger.info("MissionService", "Deleting front-pic");
        [err, front_pic] = await to(this.fileService.fetchById(obj_old.front_pic._id));
        if (err) {
          this.logger.error("MissionService", "Exception fetching front-pic: " + obj_old.front_pic._id, err);
          throw err.code ? err : { code: 500, message: "Error while fetching front_pic" }
        }
        [err] = await to(this.fileService.delete(profile, front_pic));
        if (err) {
          this.logger.error("MissionService", "Exception while deleting front_pic", err);
          throw err.code ? err : { code: 500, message: "Error while deleting front_pic" }
        }
      }
    };
    // business-logic:
    [err, msission] = await to(this.fetchById(missionId));
    if (err) {
      this.logger.error("MissionService", "Exception while fetching mission", err);
      throw err.code ? err : { code: 500, message: "Error while fetching mission" }
    }
    if (!msission) {
      this.logger.error("MissionService", "Mission not found");
      throw { code: 404, message: "Not found" }
    }
    const canEdit: boolean = this.generalModelService.profileCanEditObj(profile, msission);
    if (!canEdit) {
      this.logger.security("MissionService", "Profile unauthorized to delete (profile: " + profile._id + ", mission: " + missionId + ")");
      throw { code: 401, message: this.responses.unathorized }
    }
    [err] = await to(this.missionModel.deleteOne({ _id: msission._id }));
    if (err) {
      this.logger.error("MissionService", "Exception deleting from db", err);
      throw err.code ? err : { code: 500, message: "Error while deleting mission" }
    }
    [err] = await to(delete_files(profile, msission));
    if (err) {
      this.logger.error("MissionService", "Exception deleting files", err);
      throw err.code ? err : { code: 500, message: "Error while deleting files" }
    }
    return true;
  }

}