import { MongodbEntityIF } from "./MongodbEntityIF";

export default interface BelongsToRelateableIF extends MongodbEntityIF{
    last_event?;
}