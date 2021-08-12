import MongooseModel from "../MongooseModel";

/**
* Mongoose model for events
*/
export default class CategoryModel extends MongooseModel {
    constructor(mongoose) {
        super();
        this.schema = mongoose.Schema({
            title: { type: String, required: true }, // the kind of entity the event holds
            weight: { type: Number, required: true, default: 0 }, // factory-key that holds a key for which action the event represents (such as order_create, order_accept etc...)
            ...MongooseModel.common_fields
        });

        this.schema.pre('save', function () {
            this.updated_at = new Date();
        });

        // build model:
        this.model = mongoose.model('Category', this.schema);
    }
}








