import ResponseService from "../../general/services/ResponseService";
import ItemIF from "./PickupLocationIF";
import RequestOutIF from "../RequestOutIF";
import PickupLocationService from "./PickupLocationService";
import PickupLocationIF from "./PickupLocationIF";
import Responses from "../../general/consts/Responses";

/**
* Controller module for item-related requests.
*/
export default class PickupLocationController {
  private pickupLocationService: PickupLocationService;
  private responseService: ResponseService;
  private responses: Responses;

  constructor(pickupLocationService: PickupLocationService, responseService: ResponseService, responses: Responses) {
    this.pickupLocationService = pickupLocationService;
    this.responseService = responseService;
    this.responses = responses;
  }

  /**
* Creates a pickup-location from payload
*/
  create(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (pickupLocation: PickupLocationIF) => me.responseService.respond(res, 200, pickupLocation);
    me.pickupLocationService.create(req.body).then(ok).catch(anyErr);
  };

  /**
  * Updates a given pickup-location
  */
  update(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (item: ItemIF) => me.responseService.respond(res, 200, item);
    me.pickupLocationService.fetchById(req.body._id).then(function (pickupLocation: PickupLocationIF) {
      if (!pickupLocation) {
        return anyErr({ code: 404, message: "Not found" });
      }

      if (req.body.active) // special case for active(not automatically casting from json string to boolean, thus handle below...)
      {
        req.body.active = (req.body.active + "" == "true"); // prevent casting error
      }
      me.pickupLocationService.update(pickupLocation, req.body).then(ok).catch(anyErr);
    }).catch(anyErr);
  };

  /**
  * Fetches a given pickup-location by id
  */
  fetchById(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (item: ItemIF) => me.responseService.respond(res, 200, item);
    me.pickupLocationService.fetchById(req.params.id, req.query).then(function (pickupLocation: PickupLocationIF) {
      if (!pickupLocation) {
        return anyErr({ code: 404, message: "Not found" });
      }
      ok(pickupLocation);
    }).catch(anyErr);
  };

  /**
  * Fetches any (suggested) items
  */
 fetchMultiple(req, res) {
    const anyErr = (response: RequestOutIF) => console.log(response), //this.responseService.respond(res, response.code, { message: response.message }),
      ok = (pickupLocations: PickupLocationIF[]) => this.responseService.respond(res, 200, pickupLocations);
    this.pickupLocationService.fetchMultiple(req.query).then(ok).catch(anyErr);
  };

  /**
  * Deletes a given pickup-location by id (using soft-delete)
  */
  deleteById(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = () => this.responseService.respond(res, 200, { message: this.responses.success });
    this.pickupLocationService.deleteById(req.params.id).then(ok).catch(anyErr);
  }

};
