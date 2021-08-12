import ItemOptionsService from "./ItemOptionsService";
import Responses from "../../general/consts/Responses";
import ResponseService from "../../general/services/ResponseService";
import ItemOptionsIF from "./ItemOptionsIF";
import RequestOutIF from "../RequestOutIF";

export default class ItemOptionsController {
  private itemOptionsService: ItemOptionsService;
  private responses: Responses;
  private responseService: ResponseService;

  constructor(itemOptionsService: ItemOptionsService, responses: Responses, responseService: ResponseService) {
    this.itemOptionsService = itemOptionsService;
    this.responses = responses;
    this.responseService = responseService;
  }

  /**
  * Creates a new item-options
  */
  create(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (itemOptions: ItemOptionsIF) => this.responseService.respond(res, 200, itemOptions);
    this.itemOptionsService.create(req.body, req.profile).then(ok).catch(anyErr);
  };

  /**
   * Fetches a given item-options by id
   */
  fetchById(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (itemOptions: ItemOptionsIF) => this.responseService.respond(res, 200, itemOptions);
    this.itemOptionsService.fetchById(req.params.id).then(function (itemOptions: ItemOptionsIF) {
      if (!itemOptions) {
        return anyErr({ code: 404, message: "Not found" });
      }
      ok(itemOptions);
    }).catch(anyErr);
  }

  /**
 * Updates a new item-options
 */
  update(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (itemOptions: ItemOptionsIF) => me.responseService.respond(res, 200, itemOptions);
    this.itemOptionsService.fetchById(req.body._id).then(function (itemOptions: ItemOptionsIF) {
      if (!itemOptions) {
        return anyErr({ code: 404, message: "Not found" });
      }
      me.itemOptionsService.update(req.profile, itemOptions, req.body).then(ok).catch(anyErr);
    }).catch(anyErr);
  };


  /**
  * Deletes a given item-options by id
  */
  deleteById(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = () => this.responseService.respond(res, 200, { message: this.responses.success });
    this.itemOptionsService.deleteById(req.profile, req.params.id).then(ok).catch(anyErr);
  }

  /**
   * Fetches all item-reviews from a given user (by id)
   * offers order by, limit, offset
   */
  fetchByCurrent(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (itemOptions: ItemOptionsIF) => this.responseService.respond(res, 200, itemOptions);
    this.itemOptionsService.fetchByCurrent(req.query, req.profile).then(ok).catch(anyErr);
  };


}