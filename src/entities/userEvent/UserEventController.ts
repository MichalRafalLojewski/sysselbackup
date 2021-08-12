import ResponseService from "../../general/services/ResponseService";
import { EventIF } from "../event/EventIF";
import RequestOutIF from "../RequestOutIF";
import UserEventChecker from "./UserEventChecker";
import UserEventService from "./UserEventService";

/**
* Controller module for user-event related requests
*/
export default class UserEventController {

  private userEventService: UserEventService
  private responseService: ResponseService;
  private userEventChecker: UserEventChecker;
  constructor(userEventService: UserEventService, userEventChecker: UserEventChecker, responseService: ResponseService) {
    this.userEventService = userEventService;
    this.responseService = responseService;
    this.userEventChecker = userEventChecker;
  }

  /**
  * Fetches a given user-event by id
  */
  async fetchById(req, res) { // controller method contains code that should go in the service-method (refactor later (after adding a repositories layer))
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (event: EventIF) => this.responseService.respond(res, 200, event);
    try {
      const event = await this.userEventService.fetchById(req.params.id, req.query);
      if (this.userEventChecker.canAccess(req.profile, event)) {
        ok(event);
      } else {
        throw { code: 401, message: "Unauthorized to access event" };
      }
    } catch (exception) {
      anyErr(exception);
    }

  };

  /**
  * Fetches all user-events which current profile participates in
  */
  fetchByCurrent(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (events: EventIF[]) => this.responseService.respond(res, 200, events);
    const last_signature_only = (req.query.last_signature_only == "true" || req.query.last_signature_only == true);
    this.userEventService.fetchWithParticipants(req.query, [req.profile._id.toString()], last_signature_only).then(ok).catch(anyErr);
  };

  /**
  * Fetches all conversations between current profile and given user
  */
  fetchWithParticipants(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (events: EventIF[]) => this.responseService.respond(res, 200, events);
    if (!req.query.participants.includes(req.profile._id.toString())) // check if current profile is in participants, else add
    {
      req.query.participants.push(req.profile._id.toString());
    }
    const last_signature_only = (req.query.last_signature_only == "true" || req.query.last_signature_only == true);
    this.userEventService.fetchWithParticipants(req.query, req.query.participants, last_signature_only).then(ok).catch(anyErr);
  };

};
