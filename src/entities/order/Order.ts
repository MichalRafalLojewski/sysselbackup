import MongooseModel from "../MongooseModel";

/**
* Mongoose model for orders
*/
export default class OrderModel extends MongooseModel {
  constructor(mongoose) {
    super();
    this.schema = mongoose.Schema({
      seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
      buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
      delivery_event: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryEvent', required: false },
      items_price_total: { type: Number, min: 0 },
      shipping_price: { type: Number, min: 0 },
      total_price: { type: Number, min: 0 },
      transaction_fee: { type: Number, min: 0 },
      base_currency: { type: String, required: true },
      shipping_selected: { type: String, required: false },
      payment_option_selected: { type: String, required: false },
      paid: { type: Boolean, required: true, default: false },
      home_delivery_price: { type: Number, min: 0 },
      use_home_delivery:  { type: Boolean, required: true },
      is_escrow: { type: Boolean, required: true },
      status: { type: String, required: true },
      has_review: { type: Boolean, required: true },
      items: { type: [Object], required: true, min: 1 },
      require_accept: { type: Boolean, required: true },
      participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: false }],
      participants_info_short: { type: Object, required: false },
      comment: { type: String, required: false },
      finalized: { type: Boolean, required: true, default: false },
      estimated_delivery_date: { type: Date, required: false },
      payment_details: { type: Object, required: false },
      seller_confirmed_delivery: { type: Boolean, required: true, default: false },
      buyer_confirmed_delivery: { type: Boolean, required: true, default: false },
      seller_confirmed_payment: { type: Boolean, required: true, default: false },
      buyer_confirmed_payment: { type: Boolean, required: true, default: false },
      transaction_data_external: { type: Object, required: false },
      last_event: { type: Date, required: true, default: Date.now },
      ...MongooseModel.common_fields
    });

    this.schema.pre('save', function () {
      this.updated_at = new Date();
    });

    // define query middleware:
    this.schema.pre('find', function () {
      this.populate('seller');      // `this` is an instance of mongoose.Query
      this.populate('buyer');      // `this` is an instance of mongoose.Query
    });

    this.schema.pre('findOne', function () {
      this.populate('seller');      // `this` is an instance of mongoose.Query
      this.populate('buyer');      // `this` is an instance of mongoose.Query
    });

    // build model:
    this.model = mongoose.model('Order', this.schema);
  }

  static populateable(): string[] {
    return ["participants"];
  }
}