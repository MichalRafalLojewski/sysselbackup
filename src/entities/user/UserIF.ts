import { MongodbEntityIF } from '../MongodbEntityIF';
import GPSLocationIF from '../GPSLocationIF';

export interface ResetCodeIF {
  reset_code: string;
  created_at_timestamp: number;
  time_to_live_seconds: number;
}

export interface AddressIF {
  street: string;
  city: string;
  region: string;
  postal_code: string;
  country_code: string;
}

export enum UserType {
  NORMAL = 'normal',
  ADMIN = 'admin',
  PROVIDER = 'provider',
}

export interface UserIF extends MongodbEntityIF {
  first_name: string;
  last_name: string;
  phone: string;
  profile_pic?;
  email: string;
  type: UserType;
  birthday_timestamp?;
  password: string;
  reset_code?: ResetCodeIF;
  payment_account?;
  kyc_data?;
  client_tokens?: string[];
  location?: GPSLocationIF;
  address: AddressIF;
  active: boolean;
  token_version?: number;
}
