import {MongodbEntityIF, PicturedEntityIF} from "../MongodbEntityIF";
import GPSLocationIF from "../GPSLocationIF";
import DiscountBracketIF from "./DiscountBracketIF";

export default interface ItemIF extends MongodbEntityIF, PicturedEntityIF{
    title: string;
    description?: string;
    location?: GPSLocationIF;
    category?: string;
    tags?: string[];
    owner_user?;
    item_type: string;
    price: number;
    discount_brackets?: DiscountBracketIF[];
    unit?: string;
    in_stock?: number;
    use_in_stock: boolean;
    front_pic?;
    other_pics?: any[];
    item_options?;
    sold?: number;
    sum_rating?: number;
    number_of_ratings?: number;
    favorited_count?:number;
    active?: boolean;
    listed?: boolean;
}