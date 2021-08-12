import {MongodbEntityIF} from "../MongodbEntityIF";

export default interface ProfileSubscriptionIF extends MongodbEntityIF{
    profile;
    subscribe_to;
}