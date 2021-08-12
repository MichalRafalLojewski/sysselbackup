import GeneralJoiSchema from "../../general/JoiSchemas/GeneralJoiSchema";

interface CreateUpdateIF{
    _id?;
    profile;
    text;
    order;
    rating;
}

/**
 * Joi schema for profile-reviews
 * @param joi module
 */
export default class ProfileReviewJoiSchema {
    public create: CreateUpdateIF;
    constructor(joi, generalSchema: GeneralJoiSchema) {

        this.create = {
            profile: joi.string().min(1).max(1000).required(),
            text: joi.string().min(3).max(50000).required(),
            order: joi.string().min(1).max(200).required(),
            rating: joi.number().integer().min(1).max(5).required()
        };

    }
}