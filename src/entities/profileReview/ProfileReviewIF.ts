import {MongodbEntityIF} from "../MongodbEntityIF";

export default interface ProfileReviewIF extends MongodbEntityIF{
    text: string;
    rating: number;
    owner_profile?;
    order;
    profile;
}