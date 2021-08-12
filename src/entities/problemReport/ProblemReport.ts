import MongooseModel from "../MongooseModel";

/**
* Mongoose model for problem-reports
*/
export default class ProblemReportModel extends MongooseModel {
  constructor(mongoose) {
    super();
    this.schema = mongoose.Schema({
      type: { type: String, required: false },
      title: { type: String, required: false },
      description: { type: String, required: false },
      owner_profile: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
      ...MongooseModel.common_fields
    });

    this.schema.pre('save', function () {
      this.updated_at = new Date();
    });

    // build model:
    this.model = mongoose.model('ProblemReport', this.schema);
  }

  static populateable(): string[] {
    return ["owner_profile"];
  }
}