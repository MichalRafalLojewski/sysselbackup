import { PaymentOption } from "../order/PaymentOption";

interface CreateUpdateIF {
  _id?;
  type;
  title;
  description;
}
interface FetchMultipleIF {
  after;
  before;
}
/**
 * Joi schema for problem-reports
 * @param joi module
 */
export default class ProblemReportJoiSchema {
  public create: CreateUpdateIF;
  public update: CreateUpdateIF;
  public fetchMultiple: FetchMultipleIF;

  constructor(joi) {

    this.create = {
      type: joi.string().min(1).max(500).required(),
      title: joi.string().min(1).max(500).optional(),
      description: joi.string().min(1).max(10000).required(),
    };

    this.update = {
      _id: joi.string().min(1).max(500).required(),
      type: joi.string().min(1).max(500),
      title: joi.string().min(1).max(500),
      description: joi.string().min(1).max(10000),
    };

    this.fetchMultiple = {
      after: joi.date(),
      before: joi.date()
    }
  }
}
