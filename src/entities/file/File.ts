import MongooseModel from "../MongooseModel";

/**
* Mongoose model for files
*/
export default class FileModel extends MongooseModel {
    constructor(mongoose) {
        super();
        this.schema = mongoose.Schema({
            size_bytes: { type: Number, required: false },
            public_url: { type: String, required: true },
            file_key: { type: String, required: true },
            owner_profile: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: false },
            ...MongooseModel.common_fields
        });

        this.schema.pre('save', function () {
            this.updated_at = new Date();
        });

        // build model:
        this.model = mongoose.model('File', this.schema);
    }
}








