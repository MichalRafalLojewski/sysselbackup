import { BankInfoIF } from "./BankInfoIF";

export default interface PaymentOptionIF{
    id?: string;
    option_label:string;
    data: BankInfoIF | null;
}