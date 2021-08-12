import MongooseModel from "../MongooseModel";

/**
* Mongoose model for profile-reviews
*/
export default class ProfileReviewModel extends MongooseModel {
  constructor(mongoose) {
    super();
    this.schema = mongoose.Schema({
      text: { type: String, required: true },
      rating: { type: Number, required: true },
      order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
      owner_profile: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
      profile: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
      ...MongooseModel.common_fields
    });

    this.schema.pre('save', function () {
      this.updated_at = new Date();
    });

    // build model:
    this.model = mongoose.model('ProfileReview', this.schema);
  }

  static populateable(): string[] {
    return ["profile", "owner_profile", "order"];
  }
}
