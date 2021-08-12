import ItemService from "../item/ItemService";
import ItemReviewService from "./ItemReviewService";
import ResponseService from "../../general/services/ResponseService";
import GeneralModelService from "../../general/services/GeneralModelService";
import ItemReviewIF from "./ItemReviewIF";
import ItemIF from "../item/ItemIF";
import RequestOutIF from "../RequestOutIF";
import OrderIF from "../order/OrderIF";
import OrderService from "../order/OrderService";

export default class ItemReviewController {
  private itemService: ItemService;
  private itemReviewService: ItemReviewService;
  private responseService: ResponseService;
  private generalModelService: GeneralModelService;
  private orderService: OrderService;
  constructor(itemService: ItemService, itemReviewService: ItemReviewService, responseService: ResponseService, generalModelService: GeneralModelService, orderService: OrderService) {
    this.itemService = itemService;
    this.itemReviewService = itemReviewService;
    this.responseService = responseService;
    this.generalModelService = generalModelService;
    this.orderService = orderService;
  }

  /**
  * Posts a review for a given item
  */
  async create(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (review: ItemReviewIF) => this.responseService.respond(res, 200, review);
    // fetch order for belongs_to_order
    let belongs_to, belongs_to_kind, item: ItemIF;
    if (req.body.belongs_to) {
      belongs_to = req.body.belongs_to;
      belongs_to_kind = req.body.belongs_to_kind;
      delete req.body.belongs_to; // remove from request body if exists (not a valid attribute on object, used for event only)   
      delete req.body.belongs_to_kind; // remove from request body if exists (not a valid attribute on object, used for event only)   
    }
    try {
      item = await this.itemService.fetchById(req.body.item);
    } catch (exception) {
      if (exception.code) {
        return anyErr(exception);
      }
      return anyErr({ code: 500, message: "Error while fetching item" });
    }
    if (!item) {
      return anyErr({ code: 404, message: "Item not found" });
    }
    // create and store review:
    this.itemReviewService.create(req.body, item, req.profile, belongs_to, belongs_to_kind).then(ok).catch(anyErr);
  };

  /**
   * Fetches all item-reviews from a given user (by id)
   * offers order by, limit, offset
   */
  fetchByProfile(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (reviews: ItemReviewIF[]) => this.responseService.respond(res, 200, reviews);
    this.itemReviewService.fetchByProfile(req.query).then(ok).catch(anyErr);
  };

  /**
  * Fetches all reviews from a given item
  * offers order by, limit, offset
  */
  fetchByItem(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (reviews: ItemReviewIF[]) => me.responseService.respond(res, 200, reviews);
    me.itemService.fetchById(req.query.id).then(function (item: ItemIF) {
      if (!(item && (item.active || (req.profile && me.generalModelService.profileCanEditObj(req.profile, item))))) {
        return anyErr({ code: 404, message: "Not found" });
      }
      me.itemReviewService.fetchByItem(req.query).then(ok).catch(anyErr);
    }).catch(anyErr);
  };

  /**
  * Deletes a given item-options by id
  */
  deleteById(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = () => this.responseService.respond(res, 500, { message: "success" });
    this.itemReviewService.deleteById(req.profile, req.params.id).then(ok).catch(anyErr);
  };

  fetchById(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (review: ItemReviewIF) => this.responseService.respond(res, 200, review);
    this.itemReviewService.fetchById(req.params.id, req.query).then(function (itemReview: ItemReviewIF) {
      if (!itemReview) {
        return anyErr({ code: 404, message: "Not found" });
      }
      ok(itemReview);
    }).catch(anyErr);
  }

}