import MongooseModel from '../MongooseModel';

/**
 * Mongoose model for users
 */
export default class UserModel extends MongooseModel {
  constructor(mongoose) {
    super();

    this.schema = mongoose.Schema({
      first_name: { type: String, required: true },
      last_name: { type: String, required: true },
      phone: { type: String, required: false },
      type: { type: String, required: true, default: 'normal' },
      picture: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
        required: false,
      },
      email: { type: String, unique: true, required: true },
      birthday_timestamp: { type: Number, required: false },
      client_tokens: { type: [String], required: true, default: [] },
      password: { type: String, required: true },
      kyc_data: { type: Object, required: false }, // know-your-customer data (ex: identity verification data)
      address: { type: Object, required: false },
      reset_code: { type: Object, required: false },
      payment_account: { type: String, default: null }, // stripe account id
      location: {
        type: {
          type: String,
        },
        coordinates: {
          type: [Number],
        },
      },
      active: { type: Boolean, required: true, default: true },
      token_version: { type: Number, required: true, default: 0 },
      ...MongooseModel.common_fields,
    });

    this.schema.pre('save', function () {
      this.updated_at = new Date();
    });

    this.schema.methods.toJSON = function () {
      // to-json public (non-sensitive info only)
      var obj = this.toObject();
      delete obj.password;
      return obj;
    };

    this.schema.methods.toJSON_PRIVATE = function () {
      // private data included
      var obj = this.toObject();
      delete obj.password;
      return obj;
    };

    this.schema.index({ 'location.coordinates': '2dsphere' });

    this.model = mongoose.model('User', this.schema);
  }

  static populateable(): string[] {
    return [];
  }
}
