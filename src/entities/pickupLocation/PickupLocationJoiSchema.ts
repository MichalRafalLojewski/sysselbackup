import GeneralJoiSchema from "../../general/JoiSchemas/GeneralJoiSchema";

interface CreateUpdateIF {
  _id?;
  label;
  locationString;
  home_delivery_price;
  location;
  active;
}

/**
 * Joi schema for pickup-locations
 * @param joi module
 * */
export default class PickupLocationJoiSchema {
  public create: CreateUpdateIF;
  public update: CreateUpdateIF;

  constructor(joi, generalSchema: GeneralJoiSchema) {

    this.create = {
      label: joi.string().min(3).max(200).required(),
      home_delivery_price: joi.number().min(0).required(),
      locationString: joi.string().min(1).required(),
      location: generalSchema.gpsLocation,
      active: joi.boolean().optional()
    };

    this.update = {
      _id: joi.string().min(1).max(500).required(),
      home_delivery_price: joi.number().min(0),
      label: joi.string().min(3).max(200).optional(),
      locationString: joi.string().min(1).optional(),
      location: generalSchema.gpsLocation,
      active: joi.boolean().optional()
    };
  }
}
