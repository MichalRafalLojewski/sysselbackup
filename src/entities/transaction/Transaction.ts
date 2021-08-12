import MongooseModel from "../MongooseModel";
import ProfileModel from "../profile/Profile";
import OrderModel from "../order/Order";

/**
* Mongoose model for transactions
*/
export default class TransactionModel extends MongooseModel {
  constructor(mongoose) {
    super();
    this.schema = mongoose.Schema({
      order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: false },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
      receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
      description: { type: String, required: false },
      amount: { type: Number, required: true },
      base_currency: { type: String, required: true },
      status: { type: String, required: true, default: "PARTIAL" },
      // payment-handler data:
      external_payin_data: { type: Object, required: false },
      external_payout_data: { type: Object, required: false },
      external_payment_ids: { type: [String], required: false },
      participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: false }],
      external_payin_success: { type: Boolean, required: true, default: false },
      external_payout_success: { type: Boolean, required: true, default: false },
      // schema data
      last_event: { type: Date, required: true, default: Date.now },
      ...MongooseModel.common_fields
    });

    this.schema.pre('save', function () {
      this.updated_at = new Date();
    });

    // build model:
    this.model = mongoose.model('Transaction', this.schema);
  }

  static populateable(): string[] {
    return ["sender", "receiver", "order"]
      .concat(ProfileModel.populateable().map(child_attr => "sender." + child_attr)) // allow sender attributes to be popluated on child
      .concat(ProfileModel.populateable().map(child_attr => "receiver." + child_attr)) // allow receiver attributes to be popluated on child
      .concat(OrderModel.populateable().map(child_attr => "order." + child_attr)); // allow order attributes to be popluated on child
  }
}