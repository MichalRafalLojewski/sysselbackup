import {MongodbEntityIF} from "../MongodbEntityIF";
import BelongsToRelateableIF from "../BelongsToRelateableIF";

export enum TransactionStatus{
      COMPLETED="COMPLETED", FAILED = "FAILED", PARTIAL="PARTIAL", REFUNDED="REFUNDED"
}
export interface TransactionIF extends MongodbEntityIF, BelongsToRelateableIF{
      order?;     
      sender;
      status?: TransactionStatus;
      receiver;
      participants?:any[];
      description?: string;
      amount: number;
      base_currency: string;
      external_payin_data?;
      external_payout_data?;
      external_payin_success?: boolean;
      external_payout_success?: boolean;
      external_payment_ids?: any[];
}