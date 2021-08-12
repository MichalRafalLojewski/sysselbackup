import { MongodbEntityIF, PicturedEntityIF } from "../MongodbEntityIF";

export default interface PickupLocationIF extends MongodbEntityIF, PicturedEntityIF {
    label: string;
    date: Date;
    pickup_location: any;
    active: boolean;
}