import GeneralJoiSchema from '../../general/JoiSchemas/GeneralJoiSchema';
import ProfileModel from './Profile';

export interface CreateProfileIF {
  categories;
  title;
  description;
  participants;
  active;
  location;
  location_string;
  opening_times;
  website_url;
  tags;
  type;
  payment_options;
}

interface UpdateProfileIF extends CreateProfileIF {
  _id;
  front_pic;
  other_pics;
}

interface AddUserIF {
  user_id;
  profile_id;
}

interface FetchByIdIF {
  include_favorite_items;
  include_favorite_profiles;
}

interface TransferOwner {
  user_id;
  profile_id;
}

interface FetchMultipleIF {
  has_campaigns;
  has_items;
}
/**
 * Joi schema for profiles
 * @param joi module
 */
export default class ProfileJoiSchema {
  public create: CreateProfileIF;
  public update: UpdateProfileIF;
  public addUser: AddUserIF;
  public fetchMultiple: FetchMultipleIF;
  public fetchById: FetchByIdIF;
  public transferOwner: TransferOwner;

  constructor(joi, generalSchema: GeneralJoiSchema) {
    const dayScheduleSchema = joi.object().keys({
      open: joi.object().keys({
        hour: joi.number().min(0).max(24).required(),
        minute: joi.number().min(0).max(60).required(),
      }),
      close: joi.object().keys({
        hour: joi.number().min(0).max(24).required(),
        minute: joi.number().min(0).max(60).required(),
      }),
    });

    const openingTimesSchema = joi.object().keys({
      // one for each day of the week (1 = monday, 7 = sunday)
      1: dayScheduleSchema.optional(),
      2: dayScheduleSchema.optional(),
      3: dayScheduleSchema.optional(),
      4: dayScheduleSchema.optional(),
      5: dayScheduleSchema.optional(),
      6: dayScheduleSchema.optional(),
      7: dayScheduleSchema.optional(),
    });

    const bankInfoSchema = joi.object().keys({
      bank_name: joi.string().min(1).max(5000).required(),
      account_number: joi.string().min(1).max(5000).required(),
      IBAN: joi.string().min(1).max(5000).optional(),
    });

    const paymentOptionsSchema = joi
      .array()
      .items(
        joi.object().keys({
          option_label: joi.string().min(1).max(200).required(),
          data: bankInfoSchema.required(),
        })
      )
      .min(1);

    const paymentOptionsUpdateSchema = joi
      .array()
      .items(
        joi.object().keys({
          option_label: joi.string().min(1).max(200).required(),
          data: bankInfoSchema.required(),
          id: joi.string().min(1).max(200).optional(),
        })
      )
      .min(1);

    this.fetchById = {
      include_favorite_items: joi.boolean(),
      include_favorite_profiles: joi.boolean(),
    };

    this.fetchMultiple = {
      has_campaigns: joi.boolean(),
      has_items: joi.boolean(),
    };

    this.transferOwner = {
      user_id: joi.string().min(1).max(1000).required(),
      profile_id: joi.string().min(1).max(1000).required(),
    };

    this.create = {
      title: joi.string().min(3).max(100).required(),
      description: joi.string().min(3).max(50000),
      categories: joi.array().items(joi.string().min(1).max(1000)).min(1),
      website_url: joi.string().min(3).max(10000),
      participants: joi.array().items(joi.string().min(1).max(1000)).min(1),
      location: generalSchema.gpsLocation,
      location_string: joi.string().min(1).max(10000),
      opening_times: openingTimesSchema,
      type: joi.string().valid(ProfileModel.valid_types).required(),
      tags: joi.array().items(joi.string().min(1).max(200)).min(1).max(100),
      payment_options: paymentOptionsSchema.optional(),
      active: joi.boolean(),
    };

    this.addUser = {
      user_id: joi.string().min(1).max(1000).required(),
      profile_id: joi.string().min(1).max(1000).required(),
    };

    this.update = {
      _id: joi.string().min(3).max(100),
      title: joi.string().min(3).max(100),
      website_url: joi.string().min(3).max(10000),
      description: joi.string().min(3).max(50000),
      categories: joi.array().items(joi.string().min(1).max(1000)).min(1),
      participants: joi.array().items(joi.string().min(1).max(1000)).min(1),
      location: generalSchema.gpsLocation,
      location_string: joi.string().min(1).max(10000),
      front_pic: generalSchema.picture.allow(null),
      other_pics: joi.array().items(generalSchema.picture).unique().min(0).max(100),
      opening_times: openingTimesSchema,
      type: joi.string().valid(ProfileModel.valid_types),
      tags: joi.array().items(joi.string().min(1).max(200)).min(1).max(100),
      payment_options: paymentOptionsUpdateSchema.optional(),
      active: joi.boolean(),
    };
  }
}
