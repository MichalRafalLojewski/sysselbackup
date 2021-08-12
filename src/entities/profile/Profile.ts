import MongooseModel from '../MongooseModel';

/**
 * Mongoose model for Profiles
 * (A person OR company on the profile)
 */
export default class ProfileModel extends MongooseModel {
  constructor(mongoose) {
    super();
    ProfileModel.valid_types = ['provider', 'business', 'consumer'];

    this.schema = mongoose.Schema({
      title: { type: String, required: true },
      description: { type: String, required: false },
      website_url: { type: String, required: false },
      type: { type: String, required: true },
      tags: { type: [String], required: true, default: [] },
      categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, default: [] }],
      owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      default_item_options: { type: mongoose.Schema.Types.ObjectId, ref: 'ItemOptions', required: false },
      participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, default: [] }],
      favorite_profiles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true, default: [] }],
      favorite_items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true, default: [] }],
      favorited_count: { type: Number, required: true, default: 0 },
      location_string: { type: String, required: false },
      location: {
        type: {
          type: String,
        },
        coordinates: {
          type: [Number],
        },
      },
      front_pic: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: false },
      other_pics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File', required: true, default: [] }],
      opening_times: { type: Object, required: false },
      payment_options: { type: [Object], required: false },
      sum_rating: { type: Number, required: true, default: 0 }, // sum of all ratings received
      avg_rating: { type: Number, required: true, default: 0 }, // sum of all ratings received
      number_of_ratings: { type: Number, required: true, default: 0 }, // number of ratings received
      number_of_items: { type: Number, required: true, default: 0 },
      number_of_campaigns: { type: Number, required: true, default: 0 },
      active: { type: Boolean, required: true, default: true },
      last_activity: { type: Date, required: true, default: Date.now },
      // metadata:
      ...MongooseModel.common_fields,
    });

    this.schema.index({ location: '2dsphere' });

    this.schema.pre('save', function () {
      this.updated_at = new Date();
      this.avg_rating = this.number_of_ratings == 0 ? 0 : this.sum_rating / this.number_of_ratings; // `this` is an instance of mongoose.Query
    });

    this.schema.pre('find', function () {
      this.populate('front_pic'); // `this` is an instance of mongoose.Query
    });

    this.schema.pre('findOne', function () {
      this.populate('front_pic'); // `this` is an instance of mongoose.Query
    });

    this.schema.methods.toJSON = function () {
      // to-json public (non-sensitive info only)
      var obj = this.toObject();
      delete obj.favorite_profiles;
      delete obj.favorite_items;
      delete obj.fund_receiver;
      return obj;
    };

    /**
     * Optionally includes favorite items and/or favorite profiles in profile object
     */
    this.schema.methods.withFavoritesJSON = function (items, profiles) {
      // to-json public (non-sensitive info only)
      var obj = this.toObject();
      if (!(items == true || items == 'true')) {
        delete obj.favorite_items;
      }
      if (!(profiles == true || profiles == 'true')) {
        delete obj.favorite_profiles;
      }
      delete obj.fund_receiver;
      return obj;
    };
    // build model:
    this.model = mongoose.model('Profile', this.schema);
  }

  static populateable(): string[] {
    return ['other_pics', 'favorite_profiles', 'favorite_items', 'default_item_options', 'categories'];
  }
}
