export interface PicturedEntityIF extends MongodbEntityIF {
    front_pic?: MongodbEntityIF;
    other_pics?: MongodbEntityIF[];
}

export interface MongodbEntityIF {
    _id?;
    created_at?;
    updated_at?;
    save?;
    update?;
    populate?;
    owner_profile?;
    markModified?;
    deleted?: boolean;
    schema_version?;
}