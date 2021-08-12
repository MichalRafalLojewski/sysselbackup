interface CreateUpdateIF {
  delivery_event;
  shipping_selected;
  payment_option_selected;
  items;
  comment;
  use_home_delivery;
}

interface BuyerSellerIF {
  buyer;
  seller;
}

interface StatusIF {
  status;
}

interface PaidIF {
  paid;
}

interface PayBrainTreeIF {
  nonce;
}

interface PayStripeIF {
  accountId;
}

interface AcceptIF {
  estimated_delivery_date?;
  selected_payment_option_id?;
}

interface UpdateDeliveryDateIF {
  estimated_delivery_date?;
}

interface HasParticipantIF {}

/**
 * Joi schema for orders
 */
export default class OrderJoiSchema {
  public create: CreateUpdateIF;
  public buyerSeller: BuyerSellerIF;
  public status: StatusIF;
  public paid: PaidIF;
  public payBrainTree: PayBrainTreeIF;
  public payStripe: PayStripeIF;
  public accept: AcceptIF;
  public hasParticipant: HasParticipantIF;
  public updateDeliveryDate: UpdateDeliveryDateIF;

  constructor(joi) {
    this.create = {
      delivery_event: joi.string().min(1).max(1000).required(),
      shipping_selected: joi.string().min(1).max(1000),
      use_home_delivery: joi.boolean().required(),
      payment_option_selected: joi.string().min(1).max(1000).required(),
      comment: joi.string().min(1).max(50000),
      items: joi
        .array()
        .items(
          joi.object().keys({
            item: joi.string().min(1).max(1000).required(),
            quantity: joi.number().integer().min(1).required(),
          })
        )
        .min(1)
        .max(1000)
        .required(),
    };

    this.buyerSeller = {
      buyer: joi.string().min(1).max(1000),
      seller: joi.string().min(1).max(1000),
    };

    this.hasParticipant = {
      hasParticipant: joi.string().min(1).max(1000),
    };

    this.status = {
      status: joi.array().items(joi.string().min(1).max(50)),
    };

    this.paid = {
      paid: joi.boolean(),
    };

    this.accept = {
      estimated_delivery_date: joi.string().min(1).max(1000),
      selected_payment_option_id: joi.string().min(1).max(500),
    };

    this.updateDeliveryDate = {
      estimated_delivery_date: joi.string().min(1).max(1000).required(),
    };

    this.payBrainTree = {
      nonce: joi.object().required(),
    };

    this.payStripe = {
      accountId: joi.string().required(),
    };
  }
}
