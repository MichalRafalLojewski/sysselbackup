import GeneralJoiSchema from "../../general/JoiSchemas/GeneralJoiSchema";

interface CreateUpdateSchemaIF {
  _id?;
  title;
  description;
  category;
  tags;
  front_pic;
  other_pics;
  items;
  opening_times;
  active;
  listed;
}

interface AssignItemsIF {
  campaign_id;
  item_ids;
}

interface RemoveItemsIF {
  campaign_id;
  item_ids;
}

/**
 * Joi schema for campaigns
 * @param joi module
 */
export default class CampaignJoiSchema {
  private joi;
  private generalSchema: GeneralJoiSchema;

  public create: CreateUpdateSchemaIF;
  public update: CreateUpdateSchemaIF;
  public assignItems: AssignItemsIF;
  public removeItems: RemoveItemsIF;

  constructor(joi, generalSchema: GeneralJoiSchema) {
    this.joi = joi;
    this.generalSchema = generalSchema;

    // VALUE CONSTRAINTS:

    const dayScheduleSchema = joi.object().keys({
      open: joi.object().keys({
        hour: joi.number().min(0).max(24).required(),
        minute: joi.number().min(0).max(60).required()
      }),
      close: joi.object().keys({
        hour: joi.number().min(0).max(24).required(),
        minute: joi.number().min(0).max(60).required()
      })
    }).optional();

    const openingTimesSchema = joi.object().keys({ // one for each day of the week (1 = monday, 7 = sunday)
      1: dayScheduleSchema,
      2: dayScheduleSchema,
      3: dayScheduleSchema,
      4: dayScheduleSchema,
      5: dayScheduleSchema,
      6: dayScheduleSchema,
      7: dayScheduleSchema
    });

    this.create = {
      title: joi.string().min(3).max(200).required(),
      description: joi.string().min(3).max(50000),
      category: joi.string().min(1).max(500).optional(),
      tags: joi.array().items(joi.string().min(1).max(200)).min(1).max(100),
      front_pic: generalSchema.picture.allow(null),
      other_pics: joi.array().items(generalSchema.picture).unique().min(1).max(1000),
      items: joi.array().items(joi.string().min(1).max(1000)).min(1).max(100000),
      opening_times: openingTimesSchema,
      active: joi.boolean(),
      listed: joi.boolean()

    };

    this.update = {
      _id: joi.string().min(1).max(500).required(),
      title: joi.string().min(3).max(100),
      description: joi.string().min(3).max(50000),
      category: joi.string().min(1).max(500),
      tags: joi.array().items(joi.string().min(1).max(200)).min(1).max(100),
      front_pic: generalSchema.picture.allow(null),
      other_pics: joi.array().items(generalSchema.picture).unique().min(0).max(1000),
      items: joi.array().items(joi.string().min(1).max(1000)),
      opening_times: openingTimesSchema,
      active: joi.boolean(),
      listed: joi.boolean()
    };

    this.assignItems = {
      campaign_id: joi.string().min(1).max(1000).required(),
      item_ids: joi.array().items(joi.string().min(1).max(200)).min(1).max(10000).required()
    };


    this.removeItems = {
      campaign_id: joi.string().min(1).max(1000).required(),
      item_ids: joi.array().items(joi.string().min(1).max(200)).min(1).max(10000).required()
    };
  }
}