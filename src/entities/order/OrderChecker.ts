import OrderIF from "./OrderIF";
import ProfileIF from "../profile/ProfileIF";
import CheckerIF from "../CheckerIF";
import ItemOptionsIF from "../itemOptions/ItemOptionsIF";

/**
* Methods for checking the validity of different aspects of an order
*/
export default class OrderChecker implements CheckerIF {
  private defaultItemOptions: ItemOptionsIF;
  constructor(defaultItemOptions: ItemOptionsIF) {
    this.defaultItemOptions = defaultItemOptions;
  }

  async orderCanBePaid(order: OrderIF): Promise<boolean> {
    return order.finalized != true && order.paid != true;
  }

  /**
  * Checks that the items specified in the request were found in the db
  * @param {} items 
  * @param {*} itemIds 
  */
  async itemsRequestedMatchActual(items, itemIds) {
    if (items && items.length == itemIds.length) {
      return true;
    }
    throw ({ message: "Some items were not found", code: 404 });
  }

  /**
  * Receives a quantities-map in the form {itemId1: quantity, itemId2: quantity} (from order),
  * and an array of complete (loaded) items, and checks if all items are in stock
  */
  async itemsInStock(quantitiesMap, items) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const quantity = quantitiesMap[item._id];
      if (item.use_in_stock && (quantity > item.in_stock)) {
        throw { message: "Out of stock", code: 400 };
      }
    }
    return true
  }

  /**
  * Checks that none of the items are owned by self (cant buy from self)
  */
  async itemsNotOwnedBySelf(items, current_profile) {
    items.forEach(function (item) {
      if (item.owner_profile._id.toString() == current_profile._id.toString()) {
        throw { message: "One or more items owned by self, can't buy from self", code: 400 };
      }
    });
    return true
  }

  /**
  * Receives a payement option and a campaign as input, and checks if the given
  * payment option is supported by the given campaign
  */
  async paymentOptionSupported(paymentOption, items) {
    items.forEach((item) => {
      if (!(item.item_options || this.defaultItemOptions).accepted_payment_options.includes(paymentOption)) {
        throw { message: "Payment option not supported", code: 400 };
      }
    });
    return true;
  }

  /**
  * Receives a shipping option and a campaign as input, and checks if the given
  * shipping option is supported by the given campaign
  */
  async shippingSupported(shippingSelected, items) {
    items.forEach((item) => {
      if (!(item.item_options || this.defaultItemOptions).shipping_options.map((shipping_option) => { return shipping_option.label }).includes(shippingSelected)) {
        throw { message: "Shipping option not supported", code: 400 };
      }
    });
    return true;
  }

  /**
   * Checks that all the items have the same base-currency
   */
  async itemsSameBaseCurrency(items) {
    const base_currency = (items[0].item_options || this.defaultItemOptions).base_currency;
    items.forEach((item) => {
      if ((item.item_options || this.defaultItemOptions).base_currency != base_currency) {
        throw { message: "Some items have different base-currencies", code: 400 };
      }
    });
    return true;
  }

  /**
   * Checks that all the items has the same owner
   * @param items 
   */
  async itemsSameOwner(items) {
    const owner = items[0].owner_profile; // id not loaded to object
    items.forEach((item) => {
      if (item.owner_profile._id.toString() != owner._id.toString()) {
        throw { message: "Some items have different owners, can't buy from multiple owners in same order", code: 400 };
      }
    });
    return true;
  }

  // CANCEL ::::
  /**
   * Checks if the order can be cancelled or not
   * (ex: finalized orders may not be cancelled)
   * @param order 
   */
  async orderCanBeCancelled(order) {
    if (order && !order.finalized) {
      return true;
    }
    throw { message: "Order can not be cancelled", code: 400 };
  }

  /**
   * Checks if the given user can access the given order (isd the seller or buyer of the order)
   * @param order 
   * @param user 
   */
  async canAccess(order, profile): Promise<boolean> {
    if ((order.seller._id.toString() == profile._id.toString()) || (order.buyer._id.toString() == profile._id.toString())) {
      return true;
    }
    throw { message: "Unauthorized to access order", code: 401 };
  }

  async profileIsSeller(order, profile): Promise<boolean> {
    return order.seller._id.toString() == profile._id.toString();
  }

  async profileIsBuyer(order, profile): Promise<boolean> {
    return order.buyer._id.toString() == profile._id.toString();
  }

  /**
   * Checks if the current profile can uise the given order in a belongs_to_order relation
   * @param order 
   * @param current_profile 
   * @param target_profile 
   */
  async belongsToAccepted(order: OrderIF, current_profile: ProfileIF, target_profile: ProfileIF): Promise<boolean> {
    try {
      const [owner_can_access, target_profile_can_access] = await Promise.all([
        this.canAccess(order, current_profile),
        this.canAccess(order, target_profile)]);
      if (!(owner_can_access && target_profile_can_access)) {
        return false;
      }
      return true;
    } catch (exception) {
      throw exception.code ? exception : { code: 500, message: "Error while checking belongs_to accepted" }
    }
  }
};
