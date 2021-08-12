import ItemService from '../item/ItemService';
import OrderChecker from './OrderChecker';
import QueryService from '../../general/services/QueryService';
import OrderHelper from './OrderHelper';
import ProfileIF from '../profile/ProfileIF';
import ItemTupleIF from './ItemTupleIF';
import ItemIF from '../item/ItemIF';
import OrderIF, { OrderStatus } from './OrderIF';
import { Event } from './../event/EventIF';
import EventService from '../event/EventService';
import OrderModel from './Order';
import to from 'await-to-js';
import LoggerIF from '../../general/loggers/LoggerIF';
import { EventKey } from '../event/EventKey';
import PaymentOptionIF from '../profile/PaymentOptionIF';
import ItemOptionsIF from '../itemOptions/ItemOptionsIF';
import PickupLocationIF from '../pickupLocation/PickupLocationIF';
import PickupLocationService from '../pickupLocation/PickupLocationService';
import DeliveryEventIF from '../deliveryEvent/DeliveryEventIF';
import DeliveryEventService from '../deliveryEvent/DeliveryEventService';
import { FetchAllOrdersOutDTO } from './DTOs/FetchOrdersDTO';
import ProfileService from '../profile/ProfileService';
import UserService from '../user/UserService';
import StripeService from './paymentProcessing/stripe/StripeService';
import { PaymentIntentResultIF } from './paymentProcessing/stripe/StripeIF';
import { UserIF } from '../user/UserIF';

/**
 * Order-related functionality shared by multiple controllers
 */
export default class OrderService {
  private orderModel;
  private itemService: ItemService;
  private orderChecker: OrderChecker;
  private queryService: QueryService;
  private orderHelper: OrderHelper;
  private eventService: EventService;
  private defaultItemOptions;
  private asyncModule;
  private defaultPaymentOption: PaymentOptionIF;
  private pickupLocationService: PickupLocationService;
  private deliveryEventService: DeliveryEventService;
  private profileService: ProfileService;
  private stripeService: StripeService;
  private userService: UserService;
  private logger: LoggerIF;

  constructor(
    orderModel,
    itemService: ItemService,
    orderChecker: OrderChecker,
    queryService: QueryService,
    orderHelper: OrderHelper,
    eventService: EventService,
    asyncModule,
    defaultItemOptions: ItemOptionsIF,
    defaultPaymentOption: PaymentOptionIF,
    pickupLocationService: PickupLocationService,
    deliveryEventService: DeliveryEventService,
    profileService: ProfileService,
    stripeService: StripeService,
    userService: UserService,
    logger: LoggerIF
  ) {
    this.orderModel = orderModel;
    this.itemService = itemService;
    this.orderChecker = orderChecker;
    this.queryService = queryService;
    this.orderHelper = orderHelper;
    this.asyncModule = asyncModule;
    this.eventService = eventService;
    this.defaultItemOptions = defaultItemOptions;
    this.defaultPaymentOption = defaultPaymentOption;
    this.pickupLocationService = pickupLocationService;
    this.deliveryEventService = deliveryEventService;
    this.profileService = profileService;
    this.stripeService = stripeService;
    this.userService = userService;
    this.logger = logger;
  }

  /**
   * Fetches a given order by id
   */
  async fetchById(id, requestBody = {}): Promise<OrderIF> {
    this.logger.info('OrderService', 'Fetching order by id: ' + id);
    try {
      return await this.queryService.populateFields(OrderModel.populateable(), requestBody, this.orderModel.findOne({ _id: id }));
    } catch (exception) {
      this.logger.error('OrderService', 'Exception fetching order', exception);
      throw exception.code ? exception : { code: 500, message: 'Error while fetching order' };
    }
  }

  /**
   * Checks if the given object is an order
   */
  isOrder(obj): boolean {
    const me = this;
    return obj instanceof me.orderModel;
  }

  /**
   * Gets the total number of orders
   */
  async getCount(): Promise<number> {
    return await this.orderModel.count({});
  }

  /**
   * Fetches multiple orders the current profile participates in (is either seller or buyer)
   */
  async fetchMultiple(requestBody, current_profile: ProfileIF) {
    this.logger.info('OrderService', 'Fetching orders by profile: ' + current_profile._id);
    try {
      return this.queryService.orderByOffsetLimit(
        requestBody,
        this.filterSearch(
          requestBody,
          this.queryService.filterBuyer(
            requestBody,
            this.queryService.filterSeller(
              requestBody,
              this.queryService.filterOlderThan(
                requestBody,
                this.queryService.filterNewerThan(
                  requestBody,
                  this.queryService.filterPaid(
                    requestBody,
                    this.queryService.filterStatus(
                      requestBody,
                      this.queryService.populateFields(
                        OrderModel.populateable(),
                        requestBody,
                        this.orderModel.find({
                          participants: current_profile._id,
                        }) // current user must be buyer or seller
                      )
                    )
                  )
                )
              )
            )
          )
        )
      );
    } catch (exception) {
      this.logger.error('OrderService', 'Exception while fetching');
      throw exception.code ? exception : { code: 500, message: 'Error while fetching' };
    }
  }

  /**
   * Applies optional search on orders for buyer and seller title
   * @param requestBody
   * @param query
   */
  filterSearch(requestBody, query) {
    if (requestBody.search) {
      const searchQuery = { $regex: '.*' + requestBody.search + '.*', $options: 'i' };
      return query.find({
        $or: [{ 'participants_info_short.seller.title': searchQuery }, { 'participants_info_short.buyer.title': searchQuery }],
      });
    }
    return query;
  }

  /**
   * Fetches multiple orders the current profile participates in (is either seller or buyer)
   */
  async fetchAny(requestBody): Promise<FetchAllOrdersOutDTO> {
    this.logger.info('OrderService', 'Fetching all orders');
    try {
      const [totalCount, result] = await Promise.all([
        this.getCount(),
        this.queryService.orderByOffsetLimit(
          requestBody,
          this.filterSearch(
            requestBody,
            this.queryService.filterBuyer(
              requestBody,
              this.queryService.filterSeller(
                requestBody,
                this.queryService.filterOlderThan(
                  requestBody,
                  this.queryService.filterNewerThan(
                    requestBody,
                    this.queryService.filterPaid(
                      requestBody,
                      this.queryService.filterStatus(
                        requestBody,
                        this.queryService.filterHasParticipant(
                          requestBody,
                          this.queryService.populateFields(
                            OrderModel.populateable(),
                            requestBody,
                            this.orderModel.find({}) // current user must be buyer or seller
                          )
                        )
                      )
                    )
                  )
                )
              )
            )
          )
        ),
      ]);
      return {
        metaData: { totalCount },
        data: result,
      };
    } catch (exception) {
      this.logger.error('OrderService', 'Exception while fetching', exception);
      throw exception.code ? exception : { code: 500, message: 'Error while fetching' };
    }
  }

  /**
   * Receives the items-tuple array of an order,
   * and adds the stock back to the each item
   * (used for cancelling orders)
   *
   * @param Tuples array, example: [ {"item":"5df4f1c3ddfe1a23a7ed4768", "quantity":2} ]
   */
  reverseItemsStock(itemTuples: ItemTupleIF[]) {
    this.logger.info('OrderService', 'Reversing stock for items: ' + itemTuples);
    let err,
      prep_items_result,
      items: ItemIF[],
      me = this;
    const prep = async () => {
      [err, prep_items_result] = await to(this.orderHelper.prepItems(itemTuples));
      if (err) {
        this.logger.error('OrderService', 'Exception while prepping items');
        throw err.code ? err : { code: 500, message: 'Error while prepping items' };
      }
      [err, items] = await to(this.itemService.fetchMultipleById(prep_items_result.ids));
      if (err) {
        this.logger.error('OrderService', 'Exception while fetching items: [' + prep_items_result.ids + ']');
        throw err.code ? err : { code: 500, message: 'Error while fetching items' };
      }
    };
    return new Promise((resolve, reject) => {
      prep()
        .then(() => {
          this.asyncModule.each(
            items,
            function (item: ItemIF, callback) {
              if (item.use_in_stock) {
                item.in_stock += prep_items_result.quantities[item._id]; // add back to stock
              }
              item.sold -= prep_items_result.quantities[item._id]; // deduct from sold
              item.save((err) => {
                if (err) {
                  me.logger.error('OrderService', 'Exception while saving item: ' + item._id);
                  return reject(err.code ? err : { code: 500, message: 'Error while saving item' });
                }
                callback(); // tell async that current object is done processing
              });
            },
            resolve
          );
        })
        .catch(reject);
    });
  }

  /**
   * Receives the items-tuple array of an order,
   * and reduces the stock back to the each item
   * (used for cancelling orders)
   *
   * @param Tuples array, example: [ {"item":"5df4f1c3ddfe1a23a7ed4768", "quantity":2} ]
   */
  reduceItemsStock(itemTuples: ItemTupleIF[]) {
    let err,
      prep_items_result,
      items: ItemIF[],
      me = this;
    this.logger.info('OrderService', 'Reversing stock for items: ' + itemTuples);
    const prep = async () => {
      [err, prep_items_result] = await to(this.orderHelper.prepItems(itemTuples));
      if (err) {
        this.logger.error('OrderService', 'Exception while prepping items');
        throw err.code ? err : { code: 500, message: 'Error while prepping items' };
      }
      [err, items] = await to(this.itemService.fetchMultipleById(prep_items_result.ids));
      if (err) {
        me.logger.error('OrderService', 'Exception while fetching items: [' + prep_items_result.ids + ']');
        throw err.code ? err : { code: 500, message: 'Error while fetching items' };
      }
    };
    return new Promise((resolve, reject) => {
      const me = this;
      prep()
        .then(() => {
          this.asyncModule.each(
            items,
            function (item: ItemIF, callback) {
              if (item.use_in_stock) {
                item.in_stock -= prep_items_result.quantities[item._id]; // add back to stock
              }
              item.sold += prep_items_result.quantities[item._id]; // deduct from sold
              item.save((err) => {
                if (err) {
                  me.logger.error('OrderService', 'Exception while saving item: ' + item._id);
                  return reject(err.code ? err : { code: 500, message: 'Error while saving item' });
                }
                callback(); // tell async that current object is done processing
              });
            },
            resolve
          );
        })
        .catch(reject);
    });
  }

  /**
   * Receives a list of items (from db (orm)) and a quantities map,
   * and reduces the stock of each item according to the quantities map
   * @param Items array from db
   * @param quantitiesMapb (mapping from id->quantitiy, ex: [{item_id, 2}])
   */
  reduceItemsStock_itemsFromDb(items_orm: ItemIF[], quantitiesMap) {
    this.logger.info('OrderService', 'Reducing stock for items: [' + items_orm.map((item) => item._id)) + ']';
    const me = this;
    return new Promise(function (resolve, reject) {
      // update in_stock of each item:
      me.asyncModule.each(
        items_orm,
        function (item: ItemIF, callback) {
          if (item.use_in_stock) {
            item.in_stock -= quantitiesMap[item._id]; // deduct from stock
          }
          item.sold += quantitiesMap[item._id]; // add to sold
          item.save((err) => {
            if (err) {
              me.logger.error('OrderService', 'Exception saving item: ' + item._id);
              return reject(err.code ? err : { code: 500, message: 'Error while saving item' });
            }
            callback(); // tell async that current object is done processing
          });
        },
        resolve
      );
    });
  }

  /**
   * Receives a list of items (from db (orm)) and a quantities map,
   * and adds the stock back to each item according to the quantities map
   * @param Items array from db
   * @param quantitiesMapb (mapping from id->quantitiy, ex: [{item_id, 2}])
   */
  reverseItemsStock_itemsFromDb(items_orm: ItemIF[], quantitiesMap) {
    this.logger.info('OrderService', 'Reversing stock for items: [' + items_orm.map((item) => item._id)) + ']';
    const me = this;
    return new Promise(function (resolve, reject) {
      // update in_stock of each item:
      me.asyncModule.each(
        items_orm,
        function (item: ItemIF, callback) {
          if (item.use_in_stock) {
            item.in_stock += quantitiesMap[item._id]; // add back to stock
          }
          item.sold -= quantitiesMap[item._id]; // deduct from sold
          item.save((err) => {
            if (err) {
              me.logger.error('OrderService', 'Exception saving item: ' + item._id);
              return reject(err.code ? err : { code: 500, message: 'Error while saving item' });
            }
            callback(); // tell async that current object is done processing
          });
        },
        resolve
      );
    });
  }

  storeOrder(order_obj: OrderIF): Promise<OrderIF> {
    this.logger.info('OrderService', 'Saving order');
    const me = this;
    return new Promise(function (resolve, reject) {
      // create and store order
      const order = new me.orderModel(order_obj);
      order.save(function (error, obj) {
        // save created order to db
        if (error) {
          // check for error
          me.logger.error('OrderService', 'Exception saving order');
          return reject(error);
        }
        resolve(obj);
      });
    });
  }

  /**
   * Creates a given order from request body, validates it, and stores in db
   */
  async create(requestBody: OrderIF, profile: ProfileIF) {
    this.logger.info('OrderService', 'Exception saving order');
    let err, itemsData, items: ItemIF[], order_obj: OrderIF, order: OrderIF, pickupLocation: PickupLocationIF, deliveryEvent: DeliveryEventIF, seller: ProfileIF;
    const on_logic_complete = async (order: OrderIF) => {
      [err] = await to(this.eventService.create(new Event('Order', EventKey.ORDER_CREATE, order._id, [order.seller, order.buyer], order._id, 'Order')));
      if (err) {
        this.logger.error('OrderService', 'Exception creating event', err);
        throw err.code ? err : { code: 500, message: 'Error during post-logic: Creating event' };
      }
      if (order.status == OrderStatus.ACCEPTED) {
        [err] = await to(this.eventService.create(new Event('Order', EventKey.ORDER_ACCEPT, order._id, [order.seller, order.buyer], order._id, 'Order')));
        if (err) {
          this.logger.error('OrderService', 'Exception creating event', err);
          throw err.code ? err : { code: 500, message: 'Error during post-logic: Creating event' };
        }
      }
    };
    [err, deliveryEvent] = await to(this.deliveryEventService.fetchById(requestBody.delivery_event));
    if (err) {
      this.logger.error('OrderService', 'Exception while fetching delivery-event with id: ' + requestBody.delivery_event, err);
      throw err.code ? err : { code: 500, message: 'Error fetching delivery event wirth id: ' + requestBody.delivery_event };
    }
    if (!deliveryEvent) {
      this.logger.error('OrderService', 'Delivery-event not found: ' + requestBody.delivery_event, err);
      throw { code: 404, message: 'Delivery-event not found: ' + requestBody.delivery_event };
    }
    [err, pickupLocation] = await to(this.pickupLocationService.fetchById(deliveryEvent.pickup_location._id));
    if (err) {
      this.logger.error('OrderService', 'Exception while fetching pickup location with id: ' + deliveryEvent.pickup_location._id, err);
      throw err.code ? err : { code: 500, message: 'Error fetching pickup location: ' + deliveryEvent.pickup_location._id };
    }
    if (!pickupLocation) {
      this.logger.error('OrderService', 'Pickup location not found: ' + deliveryEvent.pickup_location._id, err);
      throw err.code ? err : { code: 404, message: 'Pickup location not found: ' + deliveryEvent.pickup_location._id };
    }
    [err, itemsData] = await to(this.orderHelper.prepItems(requestBody.items));
    if (err) {
      this.logger.error('OrderService', 'Exception while preparing items for order', err);
      throw err.code ? err : { code: 500, message: 'Error while preparing items for order' };
    }
    const itemIds = itemsData.ids,
      quantitiesMap = itemsData.quantities;
    [err, items] = await to(this.itemService.fetchMultipleById(itemIds, { active: true }));
    const fetchedItemIds = items.map((item) => item._id.toString());
    if (err) {
      this.logger.error('OrderService', 'Exception while fetching items for order: [' + itemIds + ']', err);
      throw err.code ? err : { code: 500, message: 'Error while fetching items in order' };
    }
    if (itemIds.filter((id) => !fetchedItemIds.includes(id.toString())).length > 0) {
      this.logger.error('OrderService', 'One or more items not found, or is not active: [' + itemIds + ']');
      throw { code: 403, message: 'One or more items not found, or is not active: [' + itemIds + ']' };
    }
    [err] = await to(this.validateOrder(profile, requestBody, items, itemIds, quantitiesMap));
    if (err) {
      this.logger.error('OrderService', 'Exception while validating order', err);
      throw err.code ? err : { code: 500, message: 'Error while validating order' };
    }
    const seller_id = items[0].owner_profile._id;
    this.logger.info('OrderService', 'Fetching seller profile with id: ' + seller_id);
    [err, seller] = await to(this.profileService.fetchById(seller_id));
    if (err) {
      this.logger.error('OrderService', 'Error fetching seller profile: ' + seller_id);
      throw err.code ? err : { code: 500, message: 'Error fetching seller profile with id: ' + seller_id };
    }
    if (!seller) {
      this.logger.error('OrderService', 'Seller profile not found, id: ' + seller_id);
      throw err.code ? err : { code: 404, message: 'Seller profile not found, id: ' + seller_id };
    }
    [err, order_obj] = await to(this.generateOrder(items, quantitiesMap, requestBody, profile, seller, pickupLocation));
    if (err) {
      this.logger.error('OrderService', 'Exception while generating order', err);
      throw err.code ? err : { code: 500, message: 'Error while generating order' };
    }
    [err, order] = await to(this.storeOrder(order_obj));
    if (err) {
      this.logger.error('OrderService', 'Exception while storing order', err);
      throw err.code ? err : { code: 500, message: 'Error while storing order' };
    }
    [err] = await to(this.reduceItemsStock_itemsFromDb(items, quantitiesMap));
    if (err) {
      this.logger.error('OrderService', 'Exception while reducing stock for items in order', err);
      throw err.code
        ? err
        : {
            code: 500,
            message: 'Error while reducing stock for items in order',
          };
    }
    [err] = await to(on_logic_complete(order));
    if (err) {
      this.logger.error('OrderService', 'Exception during post-logic for order', err);
      throw err.code ? err : { code: 500, message: 'Error during post-logic for order' };
    }
    try {
      return await this.fetchById(order._id);
    } catch (exception) {
      this.logger.error('OrderService', 'Exception while fetching order after save', err);
      throw exception.code ? exception : { code: 500, message: 'Error while fetching order after save' };
    }
  }

  /**
   * Generates an order-object from campaign, items and quantitesMap
   * (used by order-controller)
   *
   * TODO: REFACTOR TO MORE SIMPLE
   */
  async generateOrder(items: ItemIF[], quantitiesMap: object, input_body: OrderIF, buyer: ProfileIF, seller: ProfileIF, pickupLocation: PickupLocationIF): Promise<OrderIF> {
    this.logger.info('OrderService', 'Generating order (profile: ' + buyer._id + ')');
    // generate derived fields:
    const order_items = items.map(function (item_obj) {
      return {
        item: item_obj, // store whole item objects as nested objects to preserve all data AT PURCAHUSE TIME (if price or item details change after puirchause, a copy of the original at pruchause time is needed.)
        quantity: quantitiesMap[item_obj._id], // store item quantity
      };
    });
    const homeDeliveryPrice: number = !!input_body.use_home_delivery ? pickupLocation.home_delivery_price : 0;
    const FIRST_ITEM: ItemIF = items[0];
    const hasItemOptions = !!FIRST_ITEM.item_options;
    const item_options: ItemOptionsIF = FIRST_ITEM.item_options || this.defaultItemOptions;
    const require_accept = hasItemOptions ? items.filter((item) => item.item_options.require_accept == true || item.item_options.require_accept == 'true').length > 0 : item_options.require_accept;
    // create order-object:
    const order: OrderIF = {
      ...input_body,
      buyer: buyer._id,
      seller: seller._id, // owner should be the same for all items in order, use first
      participants: [buyer._id, seller._id],
      use_home_delivery: !!input_body.use_home_delivery,
      home_delivery_price: homeDeliveryPrice,
      paid: false,
      has_review: false,
      status: this.orderHelper.determineStatus(item_options),
      is_escrow: false, // escrow not supported in MVP
      base_currency: item_options.base_currency, // (carried from campaign to order in order not to lose information in case campaign is deleted)
      require_accept: require_accept,
      ...(!require_accept
        ? {
            payment_details: this.defaultPaymentOption,
          }
        : {}),
      participants_info_short: {
        seller: { title: seller.title },
        buyer: { title: buyer.title },
      },
      items: order_items.map((item_tuple) => {
        return {
          item: JSON.parse(JSON.stringify(item_tuple.item)),
          quantity: item_tuple.quantity,
        };
      }),
      items_price_total: this.orderHelper.calcItemsPriceTotal(items, quantitiesMap),
      shipping_price: input_body.shipping_selected ? this.orderHelper.calcOrderShippingCost(item_options, input_body.shipping_selected) : 0,
      total_price: this.orderHelper.calcOrderPriceTotal(item_options, items, quantitiesMap, input_body.shipping_selected, homeDeliveryPrice),
    };
    return order;
  }

  /**
   * Receives the order_id and user (seller), and marks the given order as accepted
   * @param Id of order to accept
   * @param User obj (current user)
   */
  async acceptOrder(order: OrderIF, profile: ProfileIF, delivery_date?: string, payment_option_id?: string) {
    this.logger.info('OrderService', 'Accepting order');
    let err, order_saved: OrderIF;
    const post_logic = async (order: OrderIF) => {
      try {
        await this.eventService.create(new Event('Order', EventKey.ORDER_ACCEPT, order._id, [order.seller, order.buyer], order._id, 'Order'));
      } catch (exception) {
        this.logger.error('OrderService', 'Exception while saving event in post-logic', exception);
        throw exception.code ? exception : { code: 500, message: 'Error while saving event in post-logic' };
      }
    };
    if (!order.require_accept) {
      this.logger.info('OrderService', 'Order is not pending or does not require accept');
      throw {
        code: 400,
        message: 'Order is not pending or does not require accept',
      };
    }
    const is_seller: boolean = await this.orderChecker.profileIsSeller(order, profile);
    if (!is_seller) {
      this.logger.security('OrderService', 'Profile is not seller of order');
      throw { code: 400, message: 'Profile is not seller of order' };
    }
    // update order with selected payment-option:
    if (payment_option_id) {
      if (!profile.payment_options.map((option) => option.id).includes(payment_option_id)) {
        this.logger.error('OrderService', 'Selected payment-option does not exist: ' + payment_option_id + ' on profile: ' + profile._id);
        throw { code: 400, message: 'Selected payment-option not found: ' + payment_option_id };
      }
      const payment_option: PaymentOptionIF = profile.payment_options.filter((option) => option.id == payment_option_id)[0];
      order.payment_details = payment_option;
    } else {
      order.payment_details = this.defaultPaymentOption;
    }
    order.status = OrderStatus.ACCEPTED;
    if (delivery_date) {
      if (isNaN(Date.parse(delivery_date))) {
        this.logger.info('OrderService', 'Invalid delivery date');
        throw { code: 400, message: 'Invalid delivery date' };
      }
      order.estimated_delivery_date = delivery_date;
    }
    [err, order_saved] = await to(order.save());
    if (err) {
      this.logger.error('OrderService', 'Exception while saving order', err);
      throw err.code ? err : { code: 500, message: 'Error while saving order' };
    }
    [err] = await to(post_logic(order_saved));
    if (err) {
      this.logger.error('OrderService', 'Exception during post-logic', err);
      throw err.code ? err : { code: 500, message: 'Error during post-logic' };
    }
    return { message: 'success' };
  }

  async updateDeliveryDate(order: OrderIF, profile: ProfileIF, newDeliveryDate: string) {
    this.logger.info('OrderService', 'Updating delivery date for order: ' + order._id + ', Profile: ' + profile + ', new delivery date: ' + newDeliveryDate);
    let err, order_saved: OrderIF;
    const post_logic = async (order: OrderIF) => {
      try {
        await this.eventService.create(new Event('Order', EventKey.DELIVERY_TIME_CHANGED, order._id, [order.seller, order.buyer], order._id, 'Order'));
      } catch (exception) {
        this.logger.error('OrderService', 'Exception while saving event in post-logic', exception);
        throw { code: 500, message: 'Error while saving event in post-logic' };
      }
    };
    if (order.finalized == true) {
      this.logger.info('OrderService', 'Order is not accepted or is already completed');
      throw {
        code: 400,
        message: 'Order is not accepted or is already completed',
      };
    }
    if (isNaN(Date.parse(newDeliveryDate))) {
      this.logger.info('OrderService', 'Invalid date string');
      throw { code: 400, message: 'Invalid date string' };
    }
    const is_seller: boolean = await this.orderChecker.profileIsSeller(order, profile);
    if (!is_seller) {
      this.logger.security('OrderService', 'Profile is not seller of order');
      throw { code: 400, message: 'Profile is not seller of order' };
    }
    order.estimated_delivery_date = newDeliveryDate;
    [err, order_saved] = await to(order.save());
    if (err) {
      this.logger.error('OrderService', 'Exception while saving order', err);
      throw err.code ? err : { code: 500, message: 'Error while saving order' };
    }
    [err] = await to(post_logic(order_saved));
    if (err) {
      this.logger.error('OrderService', 'Exception  during post-logic', err);
      throw err.code ? err : { code: 500, message: 'Error during post-logic' };
    }
    return { message: 'Success' };
  }

  async sellerDeliveryConfirmed(order: OrderIF, profile: ProfileIF) {
    this.logger.info('OrderService', 'Delivery confirmed for order: ' + order._id + ', Profile: ' + profile);
    let err, order_saved: OrderIF;
    const post_logic = async (order: OrderIF) => {
      try {
        await this.eventService.create(new Event('Order', EventKey.DELIVERY_CONFIRMED_SELLER, order._id, [order.seller, order.buyer], order._id, 'Order'));
      } catch (exception) {
        this.logger.error('OrderService', 'Exception while saving event in post-logic', exception);
        throw { code: 500, message: 'Error while saving event in post-logic' };
      }
    };
    if (order.seller_confirmed_delivery == true) {
      this.logger.info('OrderService', 'Delivery already confirmed by seller');
      throw { code: 400, message: 'Delivery already confirmed by seller' };
    }
    const is_seller: boolean = await this.orderChecker.profileIsSeller(order, profile);
    if (!is_seller) {
      this.logger.security('OrderService', 'Profile is not seller of order');
      throw { code: 400, message: 'Profile is not seller of order' };
    }
    order.seller_confirmed_delivery = true;
    order.status = OrderStatus.DELIVERED;
    [err, order_saved] = await to(order.save());
    if (err) {
      this.logger.error('OrderService', 'Exception while saving order', err);
      throw err.code ? err : { code: 500, message: 'Error while saving order' };
    }
    [err] = await to(post_logic(order_saved));
    if (err) {
      this.logger.error('OrderService', 'Exception during post-logic', err);
      throw err.code ? err : { code: 500, message: 'Error during post-logic' };
    }
    return { message: 'success' };
  }

  async sellerPaymentConfirmed(order: OrderIF, profile: ProfileIF) {
    this.logger.info('OrderService', 'Setting order to seller confirmed payment. Order: ' + order._id + ', Profile: ' + profile._id);
    let err, order_saved: OrderIF;
    const post_logic = async (order: OrderIF) => {
      try {
        await this.eventService.create(new Event('Order', EventKey.PAYMENT_CONFIRMED_SELLER, order._id, [order.seller, order.buyer], order._id, 'Order'));
      } catch (exception) {
        this.logger.error('OrderService', 'Exception while saving event in post-logic', exception);
        throw { code: 500, message: 'Error while saving event in post-logic' };
      }
    };
    if (order.seller_confirmed_payment == true) {
      this.logger.info('OrderService', 'Payment already confirmed by seller');
      throw { code: 400, message: 'Payment already confirmed by seller' };
    }
    const is_seller: boolean = await this.orderChecker.profileIsSeller(order, profile);
    if (!is_seller) {
      this.logger.info('OrderService', 'Profile is not seller of order');
      throw { code: 400, message: 'Profile is not seller of order' };
    }
    order.seller_confirmed_payment = true;
    order.paid = true;
    order.status = OrderStatus.PAID;
    [err, order_saved] = await to(order.save());
    if (err) {
      this.logger.error('OrderService', 'Exception while saving order');
      throw err.code ? err : { code: 500, message: 'Error while saving order' };
    }
    [err] = await to(post_logic(order_saved));
    if (err) {
      this.logger.error('OrderService', 'Exception during post-logic');
      throw err.code ? err : { code: 500, message: 'Error during post-logic' };
    }
    return { message: 'success' };
  }

  async buyerDeliveryConfirmed(order: OrderIF, profile: ProfileIF) {
    this.logger.info('OrderService', 'Setting order to buyer confirmed delivery. Order: ' + order._id + ', Profile: ' + profile._id);
    let err, order_saved: OrderIF;
    const post_logic = async (order: OrderIF) => {
      try {
        await this.eventService.create(new Event('Order', EventKey.DELIVERY_CONFIRMED_BUYER, order._id, [order.seller, order.buyer], order._id, 'Order'));
      } catch (exception) {
        this.logger.error('OrderService', 'Exception while saving event in post-logic', exception);
        throw { code: 500, message: 'Error while saving event in post-logic' };
      }
    };
    const is_buyer: boolean = await this.orderChecker.profileIsBuyer(order, profile);
    if (!is_buyer) {
      this.logger.security('OrderService', 'Profile is not buyer of order');
      throw { code: 400, message: 'Profile is not buyer of order' };
    }
    if (order.finalized) {
      if (err) {
        this.logger.error('OrderService', 'Order already finalized: ' + order._id, err);
        throw { code: 403, message: 'Order already finalized: ' + order._id };
      }
    }
    order.buyer_confirmed_delivery = true;
    if (order.paid) {
      order.finalized = true;
      order.status = OrderStatus.COMPLETED;
    }
    [err, order_saved] = await to(order.save());
    if (err) {
      this.logger.error('OrderService', 'Exception while saving order', err);
      throw err.code ? err : { code: 500, message: 'Error while saving order' };
    }
    [err] = await to(post_logic(order_saved));
    if (err) {
      this.logger.error('OrderService', 'Exception during post-logic', err);
      throw err.code ? err : { code: 500, message: 'Error during post-logic' };
    }
    return { message: 'success' };
  }

  async buyerPaymentConfirmed(order: OrderIF, profile: ProfileIF) {
    this.logger.info('OrderService', 'Setting order to buyer confirmed payment. Order: ' + order._id + ', Profile: ' + profile._id);
    let err, order_saved: OrderIF;
    const post_logic = async (order: OrderIF) => {
      try {
        await this.eventService.create(new Event('Order', EventKey.PAYMENT_CONFIRMED_BUYER, order._id, [order.seller, order.buyer], order._id, 'Order'));
      } catch (exception) {
        this.logger.error('OrderService', 'Exception while saving event in post-logic', exception);
        throw { code: 500, message: 'Error while saving event in post-logic' };
      }
    };
    if (order.buyer_confirmed_payment == true) {
      this.logger.info('OrderService', 'Payment already confirmed by buyer');
      throw { code: 400, message: 'Payment already confirmed by buyer' };
    }
    const is_buyer: boolean = await this.orderChecker.profileIsBuyer(order, profile);
    if (!is_buyer) {
      this.logger.security('OrderService', 'Profile is not buyer of order');
      throw { code: 400, message: 'Profile is not buyer of order' };
    }
    order.buyer_confirmed_payment = true;
    [err, order_saved] = await to(order.save());
    if (err) {
      this.logger.error('OrderService', 'Exception while saving order', err);
      throw err.code ? err : { code: 500, message: 'Error while saving order' };
    }
    [err] = await to(post_logic(order_saved));
    if (err) {
      this.logger.error('OrderService', 'Exception during post-logic', err);
      throw err.code ? err : { code: 500, message: 'Error during post-logic' };
    }
    return { message: 'success' };
  }

  async rejectOrder(order: OrderIF, profile: ProfileIF) {
    this.logger.info('OrderService', 'Rejecting order: ' + order._id + '. Profile: ' + profile._id);
    let err, order_saved: OrderIF;
    const post_logic = async (order: OrderIF) => {
      try {
        await this.eventService.create(new Event('Order', EventKey.ORDER_REJECT, order._id, [order.seller, order.buyer], order._id, 'Order'));
      } catch (exception) {
        this.logger.error('OrderService', 'Exception while saving event in post-logic', exception);
        throw { code: 500, message: 'Error while saving event in post-logic' };
      }
    };
    if (order.status != OrderStatus.PENDING || !order.require_accept) {
      this.logger.info('OrderService', 'Order is not pending or does not require accept');
      throw {
        code: 400,
        message: 'Order is not pending or does not require accept',
      };
    }
    const is_seller: boolean = await this.orderChecker.profileIsSeller(order, profile);
    if (!is_seller) {
      this.logger.security('OrderService', 'Profile is not seller of order');
      throw { code: 400, message: 'Profile is not seller of order' };
    }
    order.status = OrderStatus.REJECTED;
    order.finalized = true;
    [err, order_saved] = await to(order.save());
    if (err) {
      this.logger.error('OrderService', 'Exception while saving order', err);
      throw err.code ? err : { code: 500, message: 'Error while saving order' };
    }
    [err] = await to(post_logic(order_saved));
    if (err) {
      this.logger.error('OrderService', 'Exception during post-logic', err);
      throw err.code ? err : { code: 500, message: 'Error during post-logic' };
    }
    return { message: 'success' };
  }

  async cancelOrder(order: OrderIF, profile: ProfileIF) {
    this.logger.info('OrderService', 'Cancelling order: ' + order._id + '. Profile: ' + profile._id);
    let err, order_saved: OrderIF;
    const post_logic = async (order: OrderIF) => {
      try {
        await this.eventService.create(new Event('Order', EventKey.ORDER_CANCEL, order._id, [order.seller, order.buyer], order._id, 'Order'));
      } catch (exception) {
        this.logger.error('OrderService', 'Exception while saving event in post-logic', exception);
        throw { code: 500, message: 'Error while saving event in post-logic' };
      }
    };
    // check conditions
    const checker_promises = [this.orderChecker.canAccess(order, profile), this.orderChecker.orderCanBeCancelled(order)];
    try {
      await Promise.all(checker_promises);
    } catch (exception) {
      this.logger.info('OrderService', 'Order cant be cancelled', exception);
      throw { code: 400, message: 'Order cant be cancelled' };
    }
    try {
      await this.reverseItemsStock(
        order.items.map(function (item) {
          return {
            item: item.item._id,
            quantity: Number(item.quantity),
          };
        })
      );
    } catch (exception) {
      this.logger.error('OrderService', 'Exception while reversing stock', exception);
      throw { code: 500, message: 'Error while reversing stock' };
    }
    order.status = OrderStatus.CANCELLED;
    order.finalized = true;
    [err, order_saved] = await to(order.save());
    if (err) {
      this.logger.error('OrderService', 'Exception while saving order', err);
      throw err.code ? err : { code: 500, message: 'Error while saving order' };
    }
    [err] = await to(post_logic(order_saved));
    if (err) {
      this.logger.error('OrderService', 'Exception during post-logic', err);
      throw err.code ? err : { code: 500, message: 'Error during post-logic' };
    }
    return { message: 'success' };
  }

  /**
   * Checks that a given order is valid
   * @param current_profile
   * @param request_body
   * @param items
   * @param itemIds
   * @param quantitiesMap
   */
  validateOrder(current_profile: ProfileIF, request_body: OrderIF, items: ItemIF[], itemIds: any[], quantitiesMap: object) {
    const orderChecks = [
      this.orderChecker.itemsRequestedMatchActual(items, itemIds),
      this.orderChecker.itemsInStock(quantitiesMap, items),
      this.orderChecker.paymentOptionSupported(request_body.payment_option_selected, items),
      this.orderChecker.itemsSameBaseCurrency(items),
      this.orderChecker.itemsSameOwner(items),
      this.orderChecker.itemsNotOwnedBySelf(items, current_profile),
    ];
    if (request_body.shipping_selected) {
      orderChecks.push(this.orderChecker.shippingSupported(request_body.shipping_selected, items));
    }
    return Promise.all(orderChecks);
  }

  /**
   * Creates stripe paymentIntent
   * @param order
   * @param accountId - stripe express account of seller
   * @returns - PaymentIntentResultIF
   */

  async performPaymentIntent(order: OrderIF, currentUser: UserIF) {
    let err, paymentIntent: PaymentIntentResultIF, profile: ProfileIF, seller: UserIF;

    [err, profile] = await to(this.profileService.fetchById(order.seller));

    if (err) {
      this.logger.error('Order Service', 'Error finding the seller profile', err);
      throw err.code ? err : { code: 500, message: 'Error retriving the seller profile' };
    }

    [err, seller] = await to(this.userService.fetchById(order.seller));

    if (err) {
      this.logger.error('Order Service', 'Error finding the seller', err);
      throw err.code ? err : { code: 500, message: 'Error retriving the seller' };
    }

    [err, paymentIntent] = await to(this.stripeService.performPaymentIntent(order, seller.payment_account, currentUser));
    order.transaction_data_external = paymentIntent;

    [err] = await to(order.save());

    if (err) {
      this.logger.error('Order Service', 'Error saving order with external-payment-info after performing payment intent', err);
      throw err.code ? err : { code: 500, message: 'Error saving order after performing payment' };
    }

    return paymentIntent;
  }

  /**
   * Confirms order paid successfully.
   * @param paymentIntnet - stripe webhook payment_intent.succeeded
   */

  async confirmPayment(paymentIntent: any) {
    let err, order: OrderIF;

    [err, order] = await to(this.fetchById(paymentIntent.metadata.order_id));

    console.log(order);
    order.paid = true;
    order.status = OrderStatus.PAID;

    [err] = await to(order.save());

    if (err) {
      this.logger.error('Order Service', 'Error saving order with confirmation after performing payment intent', err);
      throw err.code ? err : { code: 500, message: 'Error saving order after getting confirmation payment webhook from stripe' };
    }
  }
}
