import MongooseModel from "../MongooseModel";

/**
* Mongoose model for item-reviews
*/
export default class ItemReviewModel extends MongooseModel {
  constructor(mongoose) {
    super();
    this.schema = mongoose.Schema({
      text: { type: String, required: true },
      rating: { type: Number, required: true },
      owner_profile: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
      item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
      ...MongooseModel.common_fields
    });

    this.schema.pre('save', function () {
      this.updated_at = new Date();
    });
    
    // define query middleware:
    this.schema.pre('find', function () {
      this.populate('owner_profile');      // `this` is an instance of mongoose.Query
      this.populate('item');      // `this` is an instance of mongoose.Query
    });
    this.schema.pre('findOne', function () {
      this.populate('owner_profile');      // `this` is an instance of mongoose.Query
      this.populate('item');      // `this` is an instance of mongoose.Query
    });

    // build model:
    this.model = mongoose.model('ItemReview', this.schema);
  }

  static populateable(): string[] {
    return ["owner_profile", "item"];
  }
}
