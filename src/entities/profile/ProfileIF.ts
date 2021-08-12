import GPSLocationIF from '../GPSLocationIF';
import { MongodbEntityIF, PicturedEntityIF } from '../MongodbEntityIF';
import PaymentOptionIF from './PaymentOptionIF';

export enum ProfileType {
  PROVIDER = 'provider',
  BUSINESS = 'business',
  CONSUMER = 'consumer',
  ADMIN = 'admin',
}

export default interface ProfileIF extends MongodbEntityIF, PicturedEntityIF {
  title: string;
  description?: string;
  categories?: any[];
  owner?;
  fund_receiver;
  participants?: any[];
  front_pic?;
  opening_times?;
  location?: GPSLocationIF;
  default_item_options?;
  other_pics?;
  website_url?: string;
  sum_rating?: number; // sum of all ratings received
  number_of_ratings?: number; // number of ratings received
  number_of_items?: number;
  number_of_campaigns?: number;
  avg_rating?: number;
  favorite_profiles?: any[];
  favorite_items?: any[];
  favorited_count?: number;
  location_string?: string;
  type: string;
  active?: boolean;
  last_activity?;
  payment_options?: PaymentOptionIF[]; // deprecated, migght be removed in the future, uses payment-options as separate entity or default
  withFavoritesJSON?: (items_boolean, profiles_boolean) => any;
}
