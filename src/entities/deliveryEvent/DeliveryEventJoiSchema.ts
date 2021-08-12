
interface CreateUpdateIF {
  _id?;
  label;
  date;
  pickup_location;
  active;
}

interface FetchMultipleIF{
  before;
  after;
}
/**
 * Joi schema for delivery-events
 * @param joi module
 * */
export default class DeliveryEventJoiSchema {
  public create: CreateUpdateIF;
  public update: CreateUpdateIF;
  public fetchMultiple: FetchMultipleIF;

  constructor(joi) {

    this.create = {
      label: joi.string().min(3).max(200).required(),
      date: joi.date().required(),
      pickup_location: joi.string().min(3).max(200).required(),
      active: joi.boolean().optional()
    };

    this.update = {
      _id: joi.string().min(1).max(500).required(),
      label: joi.string().min(3).max(200),
      date: joi.date(),
      pickup_location: joi.string().min(3).max(200),
      active: joi.boolean()
    };

    this.fetchMultiple = {
      after: joi.date(),
      before: joi.date()
    }
  }
}
