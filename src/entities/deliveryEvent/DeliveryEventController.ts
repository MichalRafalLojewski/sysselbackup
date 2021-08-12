import ResponseService from "../../general/services/ResponseService";
import ItemIF from "./DeliveryEventIF";
import RequestOutIF from "../RequestOutIF";
import Responses from "../../general/consts/Responses";
import DeliveryEventService from "./DeliveryEventService";
import DeliveryEventIF from "./DeliveryEventIF";

/**
* Controller module for item-related requests.
*/
export default class DeliveryEventController {
  private deliveryEventService: DeliveryEventService;
  private responseService: ResponseService;
  private responses: Responses;

  constructor(deliveryEventService: DeliveryEventService, responseService: ResponseService, responses: Responses) {
    this.deliveryEventService = deliveryEventService;
    this.responseService = responseService;
    this.responses = responses;
  }

  /**
* Creates a delivery-event from payload
*/
  create(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (deliveryEvent: DeliveryEventIF) => me.responseService.respond(res, 200, deliveryEvent);
    me.deliveryEventService.create(req.body, req.profile).then(ok).catch(anyErr);
  };

  /**
  * Updates a given delivery-event
  */
  update(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (item: ItemIF) => me.responseService.respond(res, 200, item);
    me.deliveryEventService.fetchById(req.body._id).then(function (deliveryEvent: DeliveryEventIF) {
      if (!deliveryEvent) {
        return anyErr({ code: 404, message: "Not found" });
      }

      if (req.body.active) // special case for active(not automatically casting from json string to boolean, thus handle below...)
      {
        req.body.active = (req.body.active + "" == "true"); // prevent casting error
      }
      me.deliveryEventService.update(deliveryEvent, req.body).then(ok).catch(anyErr);
    }).catch(anyErr);
  };

  /**
  * Fetches a given delivery-event by id
  */
  fetchById(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (item: ItemIF) => me.responseService.respond(res, 200, item);
    me.deliveryEventService.fetchById(req.params.id, req.query).then(function (deliveryEvent: DeliveryEventIF) {
      if (!deliveryEvent) {
        return anyErr({ code: 404, message: "Not found" });
      }
      ok(deliveryEvent);
    }).catch(anyErr);
  };

  /**
  * Fetches any (suggested) items
  */
  fetchMultiple(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (deliveryEvent: DeliveryEventIF[]) => this.responseService.respond(res, 200, deliveryEvent);
    this.deliveryEventService.fetchMultiple(req.query).then(ok).catch(anyErr);
  };

  /**
  * Deletes a given delivery-event by id
  */
  deleteById(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = () => this.responseService.respond(res, 200, { message: this.responses.success });
    this.deliveryEventService.deleteById(req.params.id).then(ok).catch(anyErr);
  }

};
