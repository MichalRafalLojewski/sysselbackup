import MongooseModel from "../MongooseModel";
import ItemModel from "../item/Item";
import ProfileModel from "../profile/Profile";

/**
* Mongoose model for campaigns (menus)
*/
export default class CampaignModel extends MongooseModel {
  constructor(mongoose) {
    super();
    this.schema = mongoose.Schema({
      title: { type: String, required: true },
      description: { type: String, required: false },
      location: {
        type: {
          type: String,
          default: 'Point',
        },
        coordinates: {
          type: [Number]
        }
      },
      category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: false },
      tags: { type: [String], required: false },
      opening_times: { type: Object, required: false },
      front_pic: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: false },
      other_pics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File', required: false }],
      owner_profile: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
      owner_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: false }],
      active: { type: Boolean, required: true, default: true },
      listed: { type: Boolean, required: true, default: true },
      sum_rating: { type: Number, required: false, default: 0 }, // sum of all ratings received on the given campaign (to avoid having to compute)
      avg_rating: { type: Number, required: true, default: 0 }, // sum of all ratings received 
      number_of_ratings: { type: Number, required: false, default: 0 }, // number of ratings received on the given campaign (to avoid having to compute)
      ...MongooseModel.common_fields
    });

    this.schema.pre('save', function () {
      this.updated_at = new Date();
      this.avg_rating = (this.number_of_ratings == 0) ? 0 : (this.sum_rating / this.number_of_ratings);     // `this` is an instance of mongoose.Query
    });

    this.schema.pre('find', function () {
      this.populate('front_pic');      // `this` is an instance of mongoose.Query
    });

    this.schema.pre('findOne', function () {
      this.populate('front_pic');      // `this` is an instance of mongoose.Query
    });

    this.schema.index({ 'location': '2dsphere' });

    // build model:
    this.model = mongoose.model('Campaign', this.schema);
  }

  static populateable(): string[] {
    return ["owner_profile", "items", "category", "other_pics"]
      .concat(ItemModel.populateable().map(child_attr => "items." + child_attr)) // allow item attributes to be popluated on child
      .concat(ProfileModel.populateable().map(child_attr => "owner_profile." + child_attr)); // allow owner_profile attributes to be popluated on child
  }

}