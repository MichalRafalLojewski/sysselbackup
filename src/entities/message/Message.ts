import MongooseModel from "../MongooseModel";

/**
* Mongoose model for messages
*/
export default class MessageModel extends MongooseModel {
  constructor(mongoose) {
    super();
    this.schema = mongoose.Schema({
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
      receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
      text: { type: String, required: true },
      ...MongooseModel.common_fields
    });

    this.schema.pre('save', function () {
      this.updated_at = new Date();
    });

    // define query middleware:
    this.schema.pre('find', function () {
      this.populate('sender');      // `this` is an instance of mongoose.Query
      this.populate('receiver');      // `this` is an instance of mongoose.Query
    });
    this.schema.pre('findOne', function () {
      this.populate('sender');      // `this` is an instance of mongoose.Query
      this.populate('receiver');      // `this` is an instance of mongoose.Query
    });

    // build model:
    this.model = mongoose.model('Message', this.schema);
  }

  static populateable(): string[] {
    return ["sender", "conversation"];
  }
}