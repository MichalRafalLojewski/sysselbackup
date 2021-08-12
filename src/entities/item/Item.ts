import MongooseModel from "../MongooseModel";

/**
* Mongoose model for items
*/
export default class ItemModel extends MongooseModel {
  constructor(mongoose) {
    super();
    this.schema = mongoose.Schema({
      title: { type: String, required: true },
      description: { type: String, required: false },
      location: {
        type: {
          type: String
        },
        coordinates: {
          type: [Number]
        }
      },
      category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: false },
      tags: { type: [String], required: false },
      item_type: { type: String, required: true },
      price: { type: Number, required: true },
      unit: { type: String, required: true },
      discount_brackets: [new mongoose.Schema({ minimum_quantity: Number, price: Number })],
      in_stock: { type: Number, required: false },
      sold: { type: Number, required: true, default: 0 },
      use_in_stock: { type: Boolean, required: true },
      front_pic: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: false },
      other_pics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File', required: false }],
      owner_profile: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
      owner_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // reference to user is stored here for easy access control (redundant since transitive ref via owner_profile)
      item_options: { type: mongoose.Schema.Types.ObjectId, ref: 'ItemOptions', required: false },
      sum_rating: { type: Number, required: true, default: 0 }, // sum of all ratings received 
      avg_rating: { type: Number, required: true, default: 0 }, // sum of all ratings received 
      number_of_ratings: { type: Number, required: true, default: 0 }, // number of ratings received 
      active: { type: Boolean, required: true, default: true },
      listed: { type: Boolean, required: true, default: true },
      favorited_count: { type: Number, required: true, default: 0 },
      ...MongooseModel.common_fields
    });

    this.schema.pre('save', function () {
      this.updated_at = new Date();
    });

    this.schema.index({ 'location': '2dsphere' });

    // define query middleware:
    this.schema.pre('find', function () {
      this.populate('item_options');      // `this` is an instance of mongoose.Query  
      this.populate('owner_profile');      // NOTE: NEEDED FOR ITEM-CHECKER. REFACTOR IF NEEDS REMOVING
      this.populate('front_pic');      // `this` is an instance of mongoose.Query
    });

    this.schema.pre('findOne', function () {
      this.populate('item_options');      // `this` is an instance of mongoose.Query
      this.populate('owner_profile');      // `this` is an instance of mongoose.Query
      this.populate('front_pic');      // `this` is an instance of mongoose.Query
    });

    this.schema.post('save', function () {
      this.populate('item_options');      // `this` is an instance of mongoose.Query  
    });
    // build model:
    this.model = mongoose.model('Item', this.schema);
  }

  static populateable(): string[] {
    return ["other_pics", "owner_profile", "item_options", "category"];
  }
}