import MongooseModel from "../MongooseModel";

/**
* Mongoose model for missions
*/
export default class MissionModel extends MongooseModel {
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
      category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
      bids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bid', required: false }],
      tags: { type: [String], required: false },
      front_pic: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: false },
      other_pics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File', required: false }],
      owner_profile: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
      owner_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // reference to user is stored here for easy access control (redundant since transitive ref via owner_profile)
      active: { type: Boolean, required: true, default: true },
      listed: { type: Boolean, required: true, default: true },
      last_event: { type: Date, required: true, default: Date.now },
      ...MongooseModel.common_fields
    });

    this.schema.pre('save', function () {
      this.updated_at = new Date();
    });

    this.schema.pre('find', function () {
      this.populate('front_pic');      // `this` is an instance of mongoose.Query
      this.populate('owner_profile');      // `this` is an instance of mongoose.Query
    });

    this.schema.pre('findOne', function () {
      this.populate('front_pic');      // `this` is an instance of mongoose.Query
      this.populate('owner_profile');      // `this` is an instance of mongoose.Query
    });

    this.schema.index({ 'location.coordinates': '2dsphere' });

    // build model:
    this.model = mongoose.model('Mission', this.schema);
  }

  static populateable(): string[] {
    return ["owner_profile", "category", "bids", "other_pics"];
  }

}