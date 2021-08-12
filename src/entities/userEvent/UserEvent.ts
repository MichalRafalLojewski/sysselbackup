import MongooseModel from "../MongooseModel";
import UserModel from "../user/User";

/**
* Mongoose model for user-events
*/
export default class UserEventModel extends MongooseModel {
    constructor(mongoose) {
        super();
        this.schema = mongoose.Schema({
            kind: { type: String, required: true }, // the kind of entity the event holds
            event_key: { type: String, required: true }, // factory-key that holds a key for which action the event represents (such as order_create, order_accept etc...)
            data_object: { type: mongoose.Schema.Types.ObjectId, refPath: 'kind', required: true },
            participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
            belongs_to: { type: mongoose.Schema.Types.ObjectId, refPath: 'belongs_to_kind', required: false }, // links the event to another entity
            belongs_to_kind: { type: String, required: false }, // the kind of entity the event holds
            ...MongooseModel.common_fields
        });

        this.schema.pre('save', function () {
            this.updated_at = new Date();
        });

        // build model:
        this.model = mongoose.model('UserEvent', this.schema);
    }

    static populateable(): string[] {
        return ["participants", "data_object", "belongs_to"]
            .concat(UserModel.populateable().map(field => "participants." + field));
    }
}








