import {MongodbEntityIF} from "../MongodbEntityIF";

export interface BidIF extends MongodbEntityIF{
     price: number;
     owner_profile;
     mission;
     status?: BidStatus;
     item_options;
     participants?:any[];
}

export enum BidStatus{
     ACCEPTED="ACCEPTED",
     REJECTED="REJECTED",
     PENDING="PENDING"
}