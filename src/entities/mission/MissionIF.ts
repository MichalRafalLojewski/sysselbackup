import {MongodbEntityIF, PicturedEntityIF} from "../MongodbEntityIF";
import GPSLocationIF from "../GPSLocationIF";
import BelongsToRelateableIF from "../BelongsToRelateableIF";

export default interface MissionIF extends BelongsToRelateableIF, PicturedEntityIF, MongodbEntityIF{
     title: string;
     description: string;
     location?:GPSLocationIF;
     category;
     bids: any[];
     tags: string[];
     front_pic;
     other_pics: any[];
     owner_user?;
     active: boolean;
     listed: boolean;
}