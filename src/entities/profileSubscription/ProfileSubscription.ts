import MongooseModel from "../MongooseModel";

/**
* Mongoose model for storing a mapping between two profile to indicate that user A subscribes to user B
* (avoids array for storing subscriptions (too expensive))
*/
export default class ProfileSubscriptionModel extends MongooseModel {
  constructor(mongoose) {
    super();
    this.schema = mongoose.Schema({
      profile: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
      subscribe_to: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
      ...MongooseModel.common_fields
    });

    this.schema.pre('save', function () {
      this.updated_at = new Date();
    });

    // build model:
    this.model = mongoose.model('Subscription', this.schema);
  }

  static populateable(): string[] {
    return ["profile", "subscribe_to"];
  }
}