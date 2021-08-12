import Responses from "../../general/consts/Responses";
import ResponseService from "../../general/services/ResponseService";
import GeneralModelService from "../../general/services/GeneralModelService";
import MissionService from "./MissionService";
import MissionIF from "./MissionIF";
import RequestOutIF from "../RequestOutIF";

/**
* Controller module for mission-related requests.
*/
export default class MissionController {
  private missionService: MissionService;
  private responses: Responses;
  private responseService: ResponseService;
  private generalModelService: GeneralModelService;

  constructor(missionService: MissionService, responses: Responses, responseService: ResponseService, generalModelService: GeneralModelService) {
    this.missionService = missionService;
    this.responses = responses;
    this.responseService = responseService;
    this.generalModelService = generalModelService;
  }

  /**
   * Creates a mission from request, and returns the object or validation error response if invalid
   */
  create(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, response.message),
      ok = (campaign) => me.responseService.respond(res, 200, campaign);
    me.missionService.create(req.body, req.profile).then(ok).catch(anyErr);
  };

  /**
 * Updates a given mission with values from request
 */
  update(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (campaign: MissionIF) => me.responseService.respond(res, 200, campaign);
    me.missionService.fetchById(req.body._id).then(function (mission) {
      if (!mission) {
        return anyErr({ code: 404, message: "Not found" });
      }
      if (req.body.active) // special case for active (not automatically casting from json string to boolean, thus handle below...)
      {
        req.body.active = (req.body.active + "" == "true"); // prevent casting error
      }
      me.missionService.update(mission, req.profile, req.body).then(ok).catch(anyErr);
    }).catch(anyErr);
  };

  /**
* Fetches all missions that match given search criteria
* TODO: Add restrictions that limit must be set to a reasonable amount to avoid too many results
*/
  fetchAny(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (missions: MissionIF[]) => this.responseService.respond(res, 200, missions);
    this.missionService.fetchAny(req.query).then(ok).catch(anyErr);
  };


  /**
  * Fetches a given mission by id
  */
  fetchById(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (mission: MissionIF) => me.responseService.respond(res, 200, mission);
    me.missionService.fetchById(req.params.id, req.query).then(function (mission: MissionIF) {
      if (!(mission && (mission.active || (req.profile && me.generalModelService.profileCanEditObj(req.profile, mission))))) // if campaign active, allow anyone to view, else, check if user has edit privliges
      {
        return anyErr({ code: 404, message: "Not found" });
      }
      ok(mission);
    }).catch(anyErr);
  }


  /**
  * Fetches all missions from a given profile (by id)
  * offers order by, limit, offset
  */
  fetchByProfile(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (missions: MissionIF[]) => this.responseService.respond(res, 200, missions);
    this.missionService.fetchByProfile(req.query, req.profile).then(ok).catch(anyErr);
  };

  /**
  * Deletes a given campaign by id
  * NOTE: Might be improved... fetches the given model twice from db... complexity might also be reduced
  */
  delete(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = () => this.responseService.respond(res, 200, { message: this.responses.success });
    this.missionService.deleteById(req.params.id, req.profile).then(ok).catch(anyErr);
  };

  /**
  * Fetches msisions from profiles that the current profile subscribes to
  */
  fetchSubscriptionMissions(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (missions: MissionIF[]) => this.responseService.respond(res, 200, missions);
    this.missionService.fetchSubscriptionMissions(req.profile, req.query).then(ok).catch(anyErr);
  };
};
