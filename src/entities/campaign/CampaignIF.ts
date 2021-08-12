import { MongodbEntityIF, PicturedEntityIF } from "../MongodbEntityIF";
import GPSLocationIF from "../GPSLocationIF";

export interface DayTimeIF {
  hour: number;
  minute: number;
}

export interface IntraDayOpeningTimesIF {
  open: DayTimeIF;
  close: DayTimeIF;
}
export interface OpeningTimesIF {
  1?: IntraDayOpeningTimesIF;
  2?: IntraDayOpeningTimesIF;
  3?: IntraDayOpeningTimesIF;
  4?: IntraDayOpeningTimesIF;
  5?: IntraDayOpeningTimesIF;
  6?: IntraDayOpeningTimesIF;
  7?: IntraDayOpeningTimesIF;
}

export default interface CampaignIF extends MongodbEntityIF, PicturedEntityIF {
  title: string;
  description?: string;
  location?: GPSLocationIF;
  category: string;
  tags?: string[];
  campaign_type: string;
  front_pic?;
  other_pics?: any[];
  listed: boolean;
  owner_user?;
  items?: any[];
  active: boolean;
  opening_times?: OpeningTimesIF;
  sum_rating: number;
  number_of_ratings: number;
}
