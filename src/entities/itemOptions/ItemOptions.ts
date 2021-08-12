import MongooseModel from "../MongooseModel";

/**
* Mongoose model for storing payment-options allowed and shipping options for a given item
*/
export default class ItemOptionsModel extends MongooseModel {
  constructor(mongoose) {
    super();
    this.schema = mongoose.Schema({
      title: { type: String, required: false },
      owner_profile: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
      accepted_payment_options: { type: [String], required: true },
      shipping_options: { type: [Object], required: true },
      require_accept: { type: Boolean, required: true, default: false },
      use_escrow: { type: Boolean, required: true, default: false },
      base_currency: { type: String, required: true },
      ...MongooseModel.common_fields
    });

    this.schema.pre('save', function () {
      this.updated_at = new Date();
    });

    // build model:
    this.model = mongoose.model('ItemOptions', this.schema);
  }

  static populateable(): string[] {
    return ["owner_profile"];
  }
}