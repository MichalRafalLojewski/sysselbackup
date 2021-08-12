import GeneralJoiSchema from "../../general/JoiSchemas/GeneralJoiSchema";


interface CreateUpdateIF {
  _id?;
  title;
  weight;
}

/**
 * Joi schema for messages
 * @param joi module
 */
export default class CategoryJoiSchema {
  public create: CreateUpdateIF;
  public update: CreateUpdateIF;

  constructor(joi, generalSchema: GeneralJoiSchema) {

    this.create = {
      title: joi.string().min(1).max(200).required(),
      weight: joi.number().min(0).optional(),
    }

    this.update = {
      _id: joi.string().min(1).max(200).required(),
      title: joi.string().min(1).max(200).required(),
      weight: joi.number().min(0).optional(),
    }

  }
}