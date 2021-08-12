import GeneralJoiSchema from "../../general/JoiSchemas/GeneralJoiSchema";

interface CreateUpdateIF{
    _id?;
    item;
    text;
    rating;
    belongs_to_order;
}

/**
 * Joi schema for item-reviews
 * @param joi module
 */
export default class ItemReviewJoiSchema {
    public create: CreateUpdateIF;
    constructor(joi, generalSchema: GeneralJoiSchema) {

        this.create = {
            item: joi.string().min(1).max(1000).required(),
            text: joi.string().min(3).max(50000).required(),
            rating: joi.number().integer().min(1).max(5).required(),
            ...generalSchema.belongsTo
        };

    }
}