import GeneralJoiSchema from "../../general/JoiSchemas/GeneralJoiSchema";

interface CreateUpdateIF {
  _id?;
  title;
  description;
  category;
  tags;
  location;
  front_pic;
  other_pics;
  listed;
}

/**
 * Joi schema for missions
 * @param joi module
 */
export default class MissionJoiSchema {
  public create: CreateUpdateIF;
  public update: CreateUpdateIF;

  constructor(joi, generalSchema: GeneralJoiSchema) {

    this.create = {
      title: joi.string().min(1).max(1000).required(),
      description: joi.string().min(1).max(50000),
      category: joi.string().min(1).max(1000).required(),
      tags: joi.array().items(joi.string().min(1).max(200)).min(1).max(100),
      front_pic: generalSchema.picture.allow(null),
      location: generalSchema.gpsLocation,
      other_pics: joi.array().items(generalSchema.picture).unique().min(1).max(100),
      listed: joi.boolean().required()
    };

    this.update = {
      _id: joi.string().min(1).max(1000).required(),
      title: joi.string().min(1).max(1000),
      description: joi.string().min(1).max(50000),
      category: joi.string().min(1).max(1000),
      tags: joi.array().items(joi.string().min(1).max(200)),
      front_pic: generalSchema.picture.allow(null),
      location: generalSchema.gpsLocation,
      other_pics: joi.array().items(generalSchema.picture).unique().min(0).max(100),
      listed: joi.boolean()
    }
    
  }
}