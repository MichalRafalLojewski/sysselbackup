import MongooseModel from "../MongooseModel";

/**
* Mongoose model for bids
*/
export default class BidModel extends MongooseModel {
  constructor(mongoose) {
    super();
    this.schema = mongoose.Schema({
      price: { type: Number, required: true },
      participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: false }],
      owner_profile: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
      mission: { type: mongoose.Schema.Types.ObjectId, ref: 'Mission', required: true },
      item_options: { type: mongoose.Schema.Types.ObjectId, ref: 'ItemOptions', required: true },
      status: { type: String, required: true, default: "PENDING" },
      ...MongooseModel.common_fields
    });

    this.schema.pre('save', function () {
      this.updated_at = new Date();
    });

    // build model:
    this.model = mongoose.model('Bid', this.schema);
  }

  static populateable(): string[] {
    return ["owner_profile", "category", "item_options", "mission", "participants"];
  }
}