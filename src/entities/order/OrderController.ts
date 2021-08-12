import ResponseService from '../../general/services/ResponseService';
import OrderService from './OrderService';
import OrderChecker from './OrderChecker';
import Responses from '../../general/consts/Responses';
import OrderIF from './OrderIF';
import RequestOutIF from '../RequestOutIF';
import { FetchAllOrdersOutDTO } from './DTOs/FetchOrdersDTO';
import { UserType } from '../user/UserIF';

/**
 * Controller module for order-related requests.
 * contains controller-functions which are mapped to by campaign-related routes
 */
export default class OrderController {
  private responseService: ResponseService;
  private orderService: OrderService;
  private orderChecker: OrderChecker;

  constructor(responseService: ResponseService, orderService: OrderService, orderChecker: OrderChecker) {
    this.responseService = responseService;
    this.orderService = orderService;
    this.orderChecker = orderChecker;
  }

  /**
   * Marks the given order as accepted
   */
  accept(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (message) => me.responseService.respond(res, 200, message);
    me.orderService
      .fetchById(req.params.id)
      .then(function (order: OrderIF) {
        if (!order) {
          return anyErr({ code: 404, message: 'Not found' });
        }
        me.orderService
          .acceptOrder(order, req.profile, req.body.estimated_delivery_date || null, req.body.selected_payment_option_id || null)
          .then(ok)
          .catch(anyErr);
      })
      .catch(anyErr);
  }

  /**
   * Marks the given order as seller confirmed delivery
   */
  sellerDeliveryConfirmed(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (message) => me.responseService.respond(res, 200, message);
    me.orderService
      .fetchById(req.params.id)
      .then(function (order: OrderIF) {
        if (!order) {
          return anyErr({ code: 404, message: 'Not found' });
        }
        me.orderService.sellerDeliveryConfirmed(order, req.profile).then(ok).catch(anyErr);
      })
      .catch(anyErr);
  }

  /**
   * Marks the given order as seller confirmed payment received
   */
  sellerPaymentConfirmed(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (message) => me.responseService.respond(res, 200, message);
    me.orderService
      .fetchById(req.params.id)
      .then(function (order: OrderIF) {
        if (!order) {
          return anyErr({ code: 404, message: 'Not found' });
        }
        me.orderService.sellerPaymentConfirmed(order, req.profile).then(ok).catch(anyErr);
      })
      .catch(anyErr);
  }

  /**
   * Marks the given order as buyer confirmed delivery
   */
  buyerDeliveryConfirmed(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (message) => me.responseService.respond(res, 200, message);
    me.orderService
      .fetchById(req.params.id)
      .then(function (order: OrderIF) {
        if (!order) {
          return anyErr({ code: 404, message: 'Not founed' });
        }
        me.orderService.buyerDeliveryConfirmed(order, req.profile).then(ok).catch(anyErr);
      })
      .catch(anyErr);
  }

  /**
   * Marks the given order as buyer confirmed payment made
   */
  buyerPaymentConfirmed(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (message) => me.responseService.respond(res, 200, message);
    me.orderService
      .fetchById(req.params.id)
      .then(function (order: OrderIF) {
        if (!order) {
          return anyErr({ code: 404, message: 'Not founed' });
        }
        me.orderService.buyerPaymentConfirmed(order, req.profile).then(ok).catch(anyErr);
      })
      .catch(anyErr);
  }

  /**
   * Marks the given order as rejected (current user must be seller)
   */
  reject(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (message) => me.responseService.respond(res, 200, message);
    me.orderService
      .fetchById(req.params.id)
      .then(function (order: OrderIF) {
        if (!order) {
          return anyErr({ code: 404, message: 'Not found' });
        }
        me.orderService.rejectOrder(order, req.profile).then(ok).catch(anyErr);
      })
      .catch(anyErr);
  }

  /**
   * Marks the given order as cancelled (current user must be seller)
   */
  cancel(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (message) => me.responseService.respond(res, 200, message);
    me.orderService
      .fetchById(req.params.id)
      .then(function (order: OrderIF) {
        if (!order) {
          return anyErr({ code: 404, message: 'Not found' });
        }
        me.orderService.cancelOrder(order, req.profile).then(ok).catch(anyErr);
      })
      .catch(anyErr);
  }

  /**
   * Creates an order from request, and returns the object or validation error response if invalid
   */
  create(req, res) {
    // TODO: MOVE MORE LOGIC TO ORDER-SERVICE!
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (order: OrderIF) => this.responseService.respond(res, 200, order);
    this.orderService.create(req.body, req.profile).then(ok).catch(anyErr);
  }

  /**
   * Fetches a given order by id
   * (NOTE: Current user must be buyer OR seller of the given order)
   */
  fetchById(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (order: OrderIF) => me.responseService.respond(res, 200, order);
    me.orderService
      .fetchById(req.params.id, req.query)
      .then(function (order: OrderIF) {
        if (!order) {
          return anyErr({ code: 404, message: 'Not found' });
        }
        if (req.user.type == UserType.ADMIN) {
          return ok(order);
        }
        me.orderChecker
          .canAccess(order, req.profile)
          .then(function (can_access: boolean) {
            if (!can_access) {
              return anyErr({ code: 401, message: 'Unauthorized' });
            }
            ok(order);
          })
          .catch(anyErr);
      })
      .catch(anyErr);
  }

  /**
   * Fetches multiple orders that current user is involved in
   * @param req
   * @param res
   */
  fetchAny(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (orders: FetchAllOrdersOutDTO) => this.responseService.respond(res, 200, orders);
    this.orderService.fetchAny(req.query).then(ok).catch(anyErr);
  }

  /**
   * Fetches multiple orders that current user is involved in
   * @param req
   * @param res
   */
  fetchMultiple(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (orders: OrderIF[]) => this.responseService.respond(res, 200, orders);
    this.orderService.fetchMultiple(req.query, req.profile).then(ok).catch(anyErr);
  }

  /**
   * Updates a given order with a new estimated-delivery-date
   * @param req
   * @param res
   */
  updateDeliveryDate(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (message) => me.responseService.respond(res, 200, message);
    me.orderService
      .fetchById(req.params.id)
      .then(function (order: OrderIF) {
        if (!order) {
          return anyErr({ code: 404, message: 'Not found' });
        }
        me.orderService.updateDeliveryDate(order, req.profile, req.body.estimated_delivery_date).then(ok).catch(anyErr);
      })
      .catch(anyErr);
  }

  /**
   * Returns a stripe payment intent object for app to perform transaction
   * @param req
   * @param res
   */

  checkout(req, res) {
    const me = this;
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (paymentIntentObject) => this.responseService.respond(res, 200, { paymentIntentObject });
    me.orderService
      .fetchById(req.params.id)
      .then(function (order: OrderIF) {
        if (!order) {
          return anyErr({ code: 404, message: 'Order Not Found' });
        }
        me.orderService.performPaymentIntent(order, req.user).then(ok).catch(anyErr);
      })
      .catch(anyErr);
  }

  /**
   * Confirms order paid successfully.
   * @param paymentIntnet - stripe webhook payment_intent.succeeded
   */

  confirmPayment(req, res) {
    const me = this;
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = () => this.responseService.respond(res, 200, { received: true });
    me.orderService.confirmPayment(req.stripeWebhook).then(ok).catch(anyErr);
  }
}
