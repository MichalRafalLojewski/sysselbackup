import Responses from "../../general/consts/Responses";
import ResponseService from "../../general/services/ResponseService";
import RequestOutIF from "../RequestOutIF";
import CategoryIF from "./CategoryIF";
import CategoryService from "./CategoryService";
/**
* Controller module for conversation-related requests.
* contains controller-functions which are mapped to by campaign-related routes
*/
export default class CategoryController {

  private responses: Responses;
  private responseService: ResponseService;
  private categoryService: CategoryService;

  constructor(responses: Responses, categoryService: CategoryService, responseService: ResponseService) {
    this.responses = responses;
    this.responseService = responseService;
    this.categoryService = categoryService;
  }

  /**
* Fetches all events which current profile participates in
*/
  fetchById(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (events: CategoryIF) => me.responseService.respond(res, 200, events);
    me.categoryService.fetchById(req.query).then(ok).catch(anyErr);
  };

  /**
  * Fetches all events which current profile participates in
  */
  fetchMultiple(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (events: CategoryIF[]) => me.responseService.respond(res, 200, events);
    me.categoryService.fetchMultiple(req.query).then(ok).catch(anyErr);
  };

  /**
  * Creates a new category
  */
  create(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (item: CategoryIF) => me.responseService.respond(res, 200, item);
    me.categoryService.create(req.body).then(ok).catch(anyErr);
  };

  /**
* Updates a category
*/
  update(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (item: CategoryIF) => me.responseService.respond(res, 200, item);
    me.categoryService.update(req.body).then(ok).catch(anyErr);
  };

  /**
* Deletes a category
*/
  delete(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = () => me.responseService.respond(res, 200, { message: "success" });
    me.categoryService.deleteById(req.params.id).then(ok).catch(anyErr);
  };
};
