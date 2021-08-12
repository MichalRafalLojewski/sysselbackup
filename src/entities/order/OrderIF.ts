import BelongsToRelateableIF from '../BelongsToRelateableIF';
import PaymentOptionIF from '../profile/PaymentOptionIF';
import { PaymentIntentResultIF } from './paymentProcessing/stripe/StripeIF';

export enum OrderStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  PAID = 'PAID',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  REFUNDED = 'REFUNDED',
}
export interface ParticipantsInfoShortEntryIF {
  title: string;
}
export interface ParticipantsInfoShortIF {
  seller: ParticipantsInfoShortEntryIF;
  buyer: ParticipantsInfoShortEntryIF;
}
export default interface OrderIF extends BelongsToRelateableIF {
  seller;
  buyer;
  items_price_total: number;
  shipping_price: number;
  total_price: number;
  transaction_fee: number;
  base_currency: string;
  shipping_selected: string;
  payment_option_selected: string;
  paid?: boolean;
  delivery_event?: any;
  has_review?: boolean;
  is_escrow: boolean;
  status: OrderStatus;
  use_home_delivery: boolean;
  home_delivery_price: number;
  items: any[];
  comment: string;
  participants?: any[];
  participants_info_short: ParticipantsInfoShortIF;
  require_accept: boolean;
  finalized?: boolean;
  payment_details?: PaymentOptionIF;
  estimated_delivery_date?: string;
  seller_confirmed_delivery: boolean;
  buyer_confirmed_delivery: boolean;
  seller_confirmed_payment: boolean;
  buyer_confirmed_payment: boolean;
  transaction_data_external?: PaymentIntentResultIF; // Stripe Payment Intent Result
}
