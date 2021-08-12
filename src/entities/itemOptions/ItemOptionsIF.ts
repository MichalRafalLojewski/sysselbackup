import {MongodbEntityIF} from "../MongodbEntityIF";
import { PaymentOption } from "../order/PaymentOption";

export default interface ItemOptionsIF extends MongodbEntityIF{
    title?: string;
    owner_profile?;
    accepted_payment_options: PaymentOption[];
    shipping_options?: any[];
    require_accept: boolean;
    use_escrow: boolean;
    base_currency: string;
}