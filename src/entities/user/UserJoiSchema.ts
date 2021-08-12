import GeneralJoiSchema from "../../general/JoiSchemas/GeneralJoiSchema";

interface AddressIF {
  street;
  city;
  region;
  postal_code;
  country_code;
}

/**
 * Joi schema for users
 * @param joi module
 */
class BankAccountJoiSchema {
  public add;
  constructor(joi) {
    this.add = {
      label: joi.string().min(1).max(2000),
      iban: joi.string().min(1).max(2000).required(),
      bic: joi.string().min(1).max(1000).required(),
      type: joi.string().min(1).max(500).required(),
    };
  }
}
class CardJoiSchema {
  public receive_details;
  constructor(joi) {
    this.receive_details = {
      // IMPLEMENT VALIDATIN SCHEMA FOR RECEIVE-CARD-DETAILS HERE!!
      id: joi.string().min(1).max(1000).required(),
      token: joi.string().min(1).max(5000).required(),
    };
  }
}

class AddressJoiSchema {
  private joi;
  constructor(joi) {
    this.joi = joi;
  }
  private keys(): AddressIF {
    const me = this;
    return {
      street: me.joi.string().min(1).max(2000).optional(),
      city: me.joi.string().min(1).max(2000).optional(),
      region: me.joi.string().min(1).max(2000).optional(),
      postal_code: me.joi.string().min(1).max(2000).optional(),
      country_code: me.joi.string().min(2).max(2).required(),
    };
  }
  schema() {
    const me = this;
    return me.joi.object().keys(me.keys());
  }
}

export interface CreateUserIF {
  client_token?;
  first_name;
  last_name;
  phone;
  email?;
  birthday_timestamp;
  address?;
  password?;
  location;
}

interface UpdateUserIF extends CreateUserIF{
  _id;
}

interface PerformPasswordReset {
  email;
  reset_code;
  new_password;
}

interface AddKYCPageIF {
  kyc_page_content;
}

interface ChangePassword {
  old_password;
  new_password;
}

interface FetchCards {
  page;
}

interface RegisterClientToken {
  token;
}

interface ResetPassword {
  email;
}

export default class UserJoiSchema {
  public create: CreateUserIF;
  public update: UpdateUserIF;
  public addKYCPage: AddKYCPageIF;
  public bankaccount: BankAccountJoiSchema;
  public card: CardJoiSchema;
  public changePassword: ChangePassword;
  public fetchCards: FetchCards;
  public registerClientToken: RegisterClientToken;
  public resetPassword: ResetPassword;
  public performPasswordReset: PerformPasswordReset;

  constructor(joi, generalSchema: GeneralJoiSchema) {
    this.bankaccount = new BankAccountJoiSchema(joi);
    this.card = new CardJoiSchema(joi);

    this.addKYCPage = {
      kyc_page_content: joi.string().min(1).required(),
    };

    this.resetPassword = {
      email: joi.string().min(1).max(100000).required(),
    };

    this.performPasswordReset = {
      email: joi.string().min(1).max(100000).required(),
      reset_code: joi.string().min(1).max(20).required(),
      new_password: joi.string().min(8).max(200).required(),
    };

    this.fetchCards = {
      page: joi.number().min(1),
    };

    this.create = {
      first_name: joi.string().min(3).max(1000).required(),
      last_name: joi.string().min(3).max(1000).required(),
      phone: joi.string().min(3).max(50),
      location: generalSchema.gpsLocation,
      email: joi.string().email().min(1).max(4000).required(),
      birthday_timestamp: joi.number().integer().optional(),
      address: new AddressJoiSchema(joi).schema().required(),
      password: joi.string().min(8).max(200).required(),
    };

    this.update = {
      _id: joi.string().min(3).max(500).required(),
      first_name: joi.string().min(3).max(1000),
      last_name: joi.string().min(3).max(1000),
      phone: joi.string().min(3).max(50),
      location: generalSchema.gpsLocation,
      birthday_timestamp: joi.number().integer(),
      address: new AddressJoiSchema(joi).schema(),
    };

    this.registerClientToken = {
      token: joi.string().min(1).max(500).required(),
    };

    this.changePassword = {
      old_password: joi.string().min(1).max(200).required(),
      new_password: joi.string().min(8).max(200).required(),
    };
  }
}
