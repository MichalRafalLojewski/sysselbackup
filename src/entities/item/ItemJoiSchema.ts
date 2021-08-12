import GeneralJoiSchema from "../../general/JoiSchemas/GeneralJoiSchema";

interface CreateUpdateIF {
  _id?;
  title;
  description;
  category;
  tags;
  item_type;
  price;
  unit;
  discount_brackets;
  use_in_stock;
  in_stock;
  front_pic;
  other_pics;
  item_options;
  active;
  listed;
}

interface FetchFiltersIF {
  item_type;
  exclude_out_of_stock;
}

interface FetchByIdsIF {
  item_ids;
}

export const priceBracketSchema = (joi) =>
  joi.object().keys({
    price: joi.number().integer().min(0).required(),
    minimum_quantity: joi.number().integer().min(1).required(),
  });

/**
 * Joi schema for items
 * @param joi module
 * */
export default class ItemJoiSchema {
  public create: CreateUpdateIF;
  public update: CreateUpdateIF;
  public fetchFilters: FetchFiltersIF;
  public fetchByIds: FetchByIdsIF;
  constructor(joi, generalSchema: GeneralJoiSchema) {
    const VALID_ITEM_TYPES = ["product"];

    this.fetchByIds = {
      item_ids: joi.array().items(joi.string().min(1).max(200)).min(1).max(100),
    };

    this.fetchFilters = {
      item_type: joi.string().min(1),
      exclude_out_of_stock: joi.boolean(),
    };

    this.create = {
      title: joi.string().min(3).max(100).required(),
      description: joi.string().min(3).max(50000),
      category: joi.string().min(1).max(500).required(),
      tags: joi.array().items(joi.string().min(1).max(200)).min(1).max(100),
      item_type: joi.string().valid(VALID_ITEM_TYPES).required(),
      price: joi.number().integer().min(0).required(),
      unit: joi.string().required(),
      use_in_stock: joi.boolean().required(),
      discount_brackets: joi.array().items(priceBracketSchema(joi)).min(1).max(1000),
      in_stock: joi.when("use_in_stock", {
        is: joi.boolean().valid(true).required(),
        then: joi.number().integer().min(1).required(),
        otherwise: joi.number().integer().min(1).optional(),
      }),
      front_pic: generalSchema.picture.allow(null),
      other_pics: joi
        .array()
        .items(generalSchema.picture)
        .unique()
        .min(1)
        .max(100),
      item_options: joi.string().min(3).max(1000).optional(), // id of attached item-options obj
      active: joi.boolean(),
      listed: joi.boolean(),
    };

    this.update = {
      _id: joi.string().min(3).max(1000).required(),
      title: joi.string().min(3).max(100),
      description: joi.string().min(3).max(50000),
      category: joi.string().min(1).max(500),
      tags: joi.array().items(joi.string().min(1).max(200)).min(1).max(100),
      item_type: joi.string().valid(VALID_ITEM_TYPES),
      price: joi.number().integer().min(0),
      unit: joi.string(),
      discount_brackets: joi.array().items(joi.object()).min(1).max(1000),
      use_in_stock: joi.boolean(),
      in_stock: joi.when("use_in_stock", {
        is: joi.boolean().valid(true).required(),
        then: joi.number().integer().min(1).required(),
        otherwise: joi.number().integer().min(1).optional(),
      }),
      front_pic: generalSchema.picture.allow(null),
      other_pics: joi
        .array()
        .items(generalSchema.picture)
        .unique()
        .min(0)
        .max(100),
      item_options: joi.string().min(3).max(1000), // id of attached item-options obj
      active: joi.boolean(),
      listed: joi.boolean(),
    };
  }
}
