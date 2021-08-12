
interface CreateUpdateIF {
  _id?;
  price;
  mission;
  item_options;
}

/**
 * Joi schema for missions
 * @param joi module
 */
export default class BidJoiSchema {
  public create: CreateUpdateIF;

  constructor(joi) {

    this.create = {
      price: joi.number().min(0).required(),
      mission: joi.string().min(1).max(1000).required(),
      item_options: joi.string().min(1).max(1000).required()
    };

  }
}