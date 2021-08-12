import {MongodbEntityIF} from "../MongodbEntityIF";

export default interface ItemReviewIF extends MongodbEntityIF{
    text: string;
    rating: number;
    owner_profile?;
    item;
}