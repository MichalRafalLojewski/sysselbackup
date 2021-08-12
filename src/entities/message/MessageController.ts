import MessageService from "./MessageService";
import ResponseService from "../../general/services/ResponseService";
import MessageIF from "./MessageIF";
import RequestOutIF from "../RequestOutIF";
import ProfileIF from "../profile/ProfileIF";
import OrderIF from "../order/OrderIF";
import ProfileService from "../profile/ProfileService";
import OrderService from "../order/OrderService";
import to from 'await-to-js';

/**
* Controller module for message-related requests.
* contains controller-functions which are mapped to by campaign-related routes
*/
export default class MessageController {
  private messageService: MessageService;
  private responseService: ResponseService;
  private profileService: ProfileService;
  private orderService: OrderService;
  
  constructor(messageService: MessageService, responseService: ResponseService, profileService: ProfileService, orderService: OrderService) {
    this.messageService = messageService;
    this.responseService = responseService;
    this.profileService = profileService;
    this.orderService = orderService;
  }

  /**
  * Sends a message from current profile to given profile
  */
  async send(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (message: MessageIF) => this.responseService.respond(res, 200, message);
    let err, target_profile: ProfileIF;
    [err, target_profile] = await to(this.profileService.fetchById(req.body.receiver));
    if (err) { return err.code ? anyErr(err) : anyErr({ code: 500, message: "Error while fetching target profile" }) }
    if (!target_profile) { return anyErr({ code: 404, message: "Profile not found" }) }
    // fetch order for belongs_to_order
    let belongs_to, belongs_to_kind;
    if (req.body.belongs_to) {
      belongs_to = req.body.belongs_to;
      belongs_to_kind = req.body.belongs_to_kind;
      delete req.body.belongs_to; // remove from request body if exists (not a valid attribute on object, used for event only)   
      delete req.body.belongs_to_kind; // remove from request body if exists (not a valid attribute on object, used for event only)   
    }
    // create and store review:
    this.messageService.create(req.body, req.profile, target_profile, belongs_to, belongs_to_kind).then(ok).catch(anyErr);
  };
};
