import { MongodbEntityIF, PicturedEntityIF } from "../MongodbEntityIF";
import GPSLocationIF from "../GPSLocationIF";

export default interface PickupLocationIF extends MongodbEntityIF, PicturedEntityIF {
    label: string;
    locationString: string;
    home_delivery_price: number;
    location?: GPSLocationIF;
    active: boolean;
}