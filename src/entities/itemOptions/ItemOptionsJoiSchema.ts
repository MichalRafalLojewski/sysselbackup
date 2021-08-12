import { PaymentOption } from "../order/PaymentOption";

interface CreateUpdateIF{
  _id?;
  title;
  require_accept;
  accepted_payment_options;
  use_escrow;
  shipping_options;
  base_currency;
}

/**
 * Joi schema for item-options (attached to items)
 * @param joi module
 */
export default class ItemOptionsJoiSchema {
  public create: CreateUpdateIF;
  public update: CreateUpdateIF;

  constructor(joi) {

    const VALID_ACCEPTED_PAYMENT_OPTIONS = [PaymentOption.BANK_WIRE, PaymentOption.VISA],
          VALID_SHIPPING_OPTION_TYPES = ['fixed'];

    this.create = {
      title: joi.string().min(3).max(100).required(),
      require_accept: joi.boolean(),
      accepted_payment_options: joi.array().items(joi.string().valid(VALID_ACCEPTED_PAYMENT_OPTIONS).min(1).max(100)).min(1).max(100).required(),
      use_escrow: joi.boolean(),
      shipping_options: joi.array().items(joi.object().keys({
        label: joi.string().min(1).max(500).required(),
        option_type: joi.string().valid(VALID_SHIPPING_OPTION_TYPES).required(),
        price: joi.number().min(0).required()
      })),
      base_currency: joi.string().min(1).max(500).required(),
    };

    this.update = {
      _id: joi.string().min(1).max(500).required(),
      title: joi.string().min(3).max(100),
      require_accept: joi.boolean(),
      accepted_payment_options: joi.array().items(joi.string().valid(VALID_ACCEPTED_PAYMENT_OPTIONS).min(1).max(100)).min(1).max(100),
      use_escrow: joi.boolean(),
      shipping_options: joi.array().items(joi.object().keys({
        label: joi.string().min(1).max(500).required(),
        option_type: joi.string().valid(VALID_SHIPPING_OPTION_TYPES).required(),
        price: joi.number().required().min(0)
      })).min(1).max(100),
      base_currency: joi.string().min(1).max(500),
    };
  }
}
