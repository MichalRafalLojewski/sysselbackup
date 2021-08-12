import DiscountBracketIF from "../item/DiscountBracketIF";
import ItemIF from "../item/ItemIF";
import ItemOptionsIF from "../itemOptions/ItemOptionsIF";
import { OrderStatus } from "./OrderIF";

export default class OrderHelper {
  private transactionSettings;
  constructor(transactionSettings) {
    this.transactionSettings = transactionSettings;
  }
  /**
   * Receives items from a create-order request in the form [{"item_id",quantity},...]
   * and returns an array of item-ids only, and a map in the form itemId,quantity
   */
  prepItems(reqItems) {
    return new Promise((resolve, reject) => {
      const itemIds = []; // get item ids only
      const quantitiesMap = {}; //  build a quantities map in the form itemId, quantity
      // build quantities map and ids array:
      for (var itemIndex = 0; itemIndex < reqItems.length; itemIndex++) {
        const itemId = reqItems[itemIndex].item;
        const quantity = reqItems[itemIndex].quantity;
        itemIds.push(itemId); // append to item ids
        quantitiesMap[itemId] = quantity;
      }
      resolve({
        ids: itemIds,
        quantities: quantitiesMap,
      });
    });
  }

  /**
   * Receives an item-options as param, and determines the
   * status of a new order
   */
  determineStatus(itemOptions: ItemOptionsIF): OrderStatus {
    return itemOptions.require_accept
      ? OrderStatus.PENDING
      : OrderStatus.ACCEPTED;
  }

  /**
   * Calculates the price of an item based quantity
   * @param item
   * @param quantity
   */
  calcBracketPrice(item: ItemIF, quantity: number): number {
    if (!item.discount_brackets || item.discount_brackets.length < 1) {
      return item.price;
    }
    const qualifyingBrackets: DiscountBracketIF[] = item.discount_brackets.filter(
      (bracket) => bracket.minimum_quantity <= quantity
    );
    if (qualifyingBrackets.length < 1) {
      return item.price;
    }
    let largestQualifyingBracket = qualifyingBrackets[0];
    qualifyingBrackets.forEach((bracket) => {
      if (
        bracket.minimum_quantity > largestQualifyingBracket.minimum_quantity
      ) {
        largestQualifyingBracket = bracket;
      }
    });
    return largestQualifyingBracket.price;
  }

  /**
   * Calculates the total price of the items in a given order
   * Receives a list of items in the order, along with the quantities map in the form item_id,quantity
   * and returns the total price of the items in the order
   */
  calcItemsPriceTotal(items: ItemIF[], quantitiesMap): number {
    return items.map((item) => {
      return this.calcBracketPrice(item, quantitiesMap[item._id]) * Number(quantitiesMap[item._id]);
    }).reduce(function sum(prev, next) {
      return Number(prev) + Number(next);
    });
  }

  calcOrderShippingCost(item_options: ItemOptionsIF, shippingSelectedLabel: string): number {
    let shipping_price: number = 0;
    item_options.shipping_options.forEach(function (option) {
      if (shipping_price == 0 && // if not already set
        option.label == shippingSelectedLabel) {
        shipping_price = Number(option.price);
      }
    });
    return shipping_price;
  }

  /**
   * Calculates the total price of an order
   * recieves the campaign, list of items in the order, and quantitiesMap (tells the quantity of each item id (tuple of item_id,quantity))
   * and returns the total cost of the order including transaction fee
   * NOTE: TO BE TESTED!!
   */
  calcOrderPriceTotal(item_options, items, quantitiesMap, shippingSelectedLabel, homeDeliveryPrice: number = 0) {
    const total =
      this.calcItemsPriceTotal(items, quantitiesMap) +
      (shippingSelectedLabel ? this.calcOrderShippingCost(item_options, shippingSelectedLabel) : 0);
    return (
      total + // order total including sum of items and shipping
      (homeDeliveryPrice) +
      (total * this.transactionSettings.transactionFee)
    ); // transaction fee
  }
}
