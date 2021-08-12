import {MongodbEntityIF} from "../MongodbEntityIF";

export default interface CategoryIF extends MongodbEntityIF{
    title: string;
    weight: number;
}