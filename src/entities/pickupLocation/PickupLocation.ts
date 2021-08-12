import MongooseModel from "../MongooseModel";

/**
* Mongoose model for pickup-locations
*/
export default class PickupLocationModel extends MongooseModel {
  constructor(mongoose) {
    super();
    this.schema = mongoose.Schema({
      label: { type: String, required: true },
      location: {
        type: {
          type: String
        },
        coordinates: {
          type: [Number]
        }
      },
      locationString: { type: String, required: true },
      home_delivery_price: { type: Number, required: true, default: 0 },
      active: { type: Boolean, required: true, default: true },
      ...MongooseModel.common_fields
    });

    this.schema.pre('save', function () {
      this.updated_at = new Date();
    });

    this.schema.index({ 'location': '2dsphere' });

    // build model:
    this.model = mongoose.model('PickupLocation', this.schema);
  }

  static populateable(): string[] {
    return [];
  }
}