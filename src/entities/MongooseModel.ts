export default abstract class MongooseModel {
    public schema;
    public model;
    public static valid_types: string[] = [];

    public static common_fields = { // common mongoose attributes used by all orm objects
        updated_at: { type: Date, required: true, default: Date.now },
        created_at: { type: Date, required: true, default: Date.now },
        deleted: { type: Boolean, required: true, default: false },
        schema_version: { type: Number, required: true, default: 0 }
    }
}