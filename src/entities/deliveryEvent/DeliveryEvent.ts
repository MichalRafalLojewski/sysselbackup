import MongooseModel from "../MongooseModel";

/**
* Mongoose model for pickup-locations
*/
export default class DeliveryEventModel extends MongooseModel {
  constructor(mongoose) {
    super();
    this.schema = mongoose.Schema({
      label: { type: String, required: true },
      date: { type: Date, required: true },
      pickup_location: { type: mongoose.Schema.Types.ObjectId, ref: 'PickupLocation', required: true },
      active: { type: Boolean, required: true, default: true },
      ...MongooseModel.common_fields
    });

    this.schema.pre('save', function () {
      this.updated_at = new Date();
    });


    this.schema.index({ 'location': '2dsphere' });

    // build model:
    this.model = mongoose.model('DeliveryEvent', this.schema);
  }

  static populateable(): string[] {
    return ["pickup_location"];
  }
}