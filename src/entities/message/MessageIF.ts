import {MongodbEntityIF} from "../MongodbEntityIF";

export default interface MessageIF extends MongodbEntityIF{
      sender;
      receiver;
      text: string;
}