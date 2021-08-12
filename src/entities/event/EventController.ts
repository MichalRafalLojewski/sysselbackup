import EventService from "../event/EventService";
import ResponseService from "../../general/services/ResponseService";
import { EventIF } from "./EventIF";
import RequestOutIF from "../RequestOutIF";
import EventChecker from "./EventChecker";
import { ProfileParticipantWrappedDTO } from "../profile/DTOs/ProfileParticipantDTO";

/**
* Controller module for conversation-related requests.
* contains controller-functions which are mapped to by campaign-related routes
*/
export default class EventController {

  private eventService: EventService;
  private responseService: ResponseService;
  private eventChecker: EventChecker;
  constructor(eventService: EventService, eventChecker: EventChecker, responseService: ResponseService) {
    this.eventService = eventService;
    this.responseService = responseService;
    this.eventChecker = eventChecker;
  }

  /**
  * Fetches a given event by id
  */
  async fetchById(req, res) { // controller method contains code that should go in the service-method (refactor later (after adding a repositories layer))
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (event: EventIF) => this.responseService.respond(res, 200, event);
    try {
      const event = await this.eventService.fetchById(req.params.id, req.query);
      if (this.eventChecker.canAccess(req.profile, event)) {
        ok(event);
      } else {
        throw { code: 401, message: "Unauthorized to access event" };
      }
    } catch (exception) {
      anyErr(exception);
    }

  };

  /**
  * Fetches all events which current profile participates in
  */
  fetchByCurrent(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (events: EventIF[]) => this.responseService.respond(res, 200, events);
    const last_signature_only = (req.query.last_signature_only == "true" || req.query.last_signature_only == true);
    this.eventService.fetchWithParticipants(req.query, [req.profile._id.toString()], last_signature_only).then(ok).catch(anyErr);
  };

  /**
  * Fetches all profiles the current profile is related to by events (profiles that also participate in events current profile participates in)
  */
  fetchEventParticipantsByCurrent(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (profiles: ProfileParticipantWrappedDTO[]) => this.responseService.respond(res, 200, profiles);
    this.eventService.fetchEventParticipantsWithParticipants(req.query, [req.profile._id.toString()]).then(ok).catch(anyErr);
  };

  /**
  * Fetches all conversations between current profile and given profile
  */
  fetchWithParticipants(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (events: EventIF[]) => this.responseService.respond(res, 200, events);
    if (!req.query.participants.includes(req.profile._id.toString())) // check if current profile is in participants, else add
    {
      req.query.participants.push(req.profile._id.toString());
    }
    const last_signature_only = (req.query.last_signature_only == "true" || req.query.last_signature_only == true);
    this.eventService.fetchWithParticipants(req.query, req.query.participants, last_signature_only).then(ok).catch(anyErr);
  };

};
