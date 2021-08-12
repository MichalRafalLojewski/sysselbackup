import ProfileService from '../profile/ProfileService';
import TokenDispenser from '../../general/services/TokenDispenser';
import HashingService from '../../general/services/HashingService';
import { UserIF, ResetCodeIF, UserType } from './UserIF';
import ProfileIF from '../profile/ProfileIF';
import Responses from '../../general/consts/Responses';
import to from 'await-to-js';
import QueryService from '../../general/services/QueryService';
import UserModel from './User';
import LoggerIF from '../../general/loggers/LoggerIF';
import RandomService from '../../general/services/RandomService';
import { MailService } from '../../general/services/MailService';
import { FetchAllUsersOutDTO } from './DTOs/FetchUsersDTO';
import { RegisterUserOutDTO } from './DTOs/RegisterUserOutDTO';
import StripeService from '../order/paymentProcessing/stripe/StripeService';

/**
 * User-related functionality shared by multiple controllers
 */
export default class UserService {
  private userModel;
  private profileService: ProfileService;
  private tokenDispenser: TokenDispenser;
  private hashingService: HashingService;
  private responses: Responses;
  private queryService: QueryService;
  private logger: LoggerIF;
  private randomService: RandomService;
  private mailService: MailService;
  private stripeService: StripeService;

  constructor(
    userModel,
    profileService: ProfileService,
    stripeService: StripeService,
    tokenDispenser: TokenDispenser,
    hashingService: HashingService,
    queryService: QueryService,
    responses: Responses,
    randomService: RandomService,
    mailService: MailService,
    logger: LoggerIF
  ) {
    this.userModel = userModel;
    this.profileService = profileService;
    this.tokenDispenser = tokenDispenser;
    this.hashingService = hashingService;
    this.responses = responses;
    this.queryService = queryService;
    this.logger = logger;
    this.randomService = randomService;
    this.mailService = mailService;
    this.stripeService = stripeService;
  }

  /**
   * Checks if the given object is an instance of user-model
   */
  isUser(obj): boolean {
    const me = this;
    return obj instanceof me.userModel;
  }

  /**
   * Fetches a user by id
   */
  async fetchById(id, requestBody = {}): Promise<UserIF> {
    this.logger.info('UserService', 'Fetching user by id: ' + id);
    try {
      return await this.queryService.populateFields(UserModel.populateable(), requestBody, this.userModel.findOne({ _id: id }));
    } catch (exception) {
      this.logger.error('UserService', 'Exception fetching', exception);
      throw exception.code ? exception : { code: 500, message: 'Error while fetching' };
    }
  }

  /**
   * Fetches multiple users by list of ids
   */
  async fetchByIds(id: any[], requestBody = {}): Promise<UserIF[]> {
    this.logger.info('UserService', 'Fetching users by id: ' + id);
    try {
      return await this.queryService.populateFields(UserModel.populateable(), requestBody, this.userModel.find({ _id: id }));
    } catch (exception) {
      this.logger.error('UserService', 'Exception fetching', exception);
      throw exception.code ? exception : { code: 500, message: 'Error while fetching' };
    }
  }

  /**
   * Fetches a given user by its kyc-document-id
   * @param id
   */
  async fetchByExternalKYCDocumentId(id): Promise<UserIF> {
    this.logger.info('UserService', 'Fetching user by external kyc document id: ' + id);
    try {
      return await this.userModel.findOne({ external_kyc_documents: id });
    } catch (exception) {
      this.logger.error('UserService', 'Exception fetching', exception);
      throw exception.code ? exception : { code: 500, message: 'Error while fetching' };
    }
  }

  /**
   * Changes a given users password
   * @param user
   * @param new_password
   */
  async changePassword(user: UserIF, new_password: string) {
    this.logger.info('UserService', 'Changing password for user: ' + user._id);
    let err, hashVal: string;
    [err, hashVal] = await to(this.hashingService.hash(new_password));
    user.password = hashVal; // set password to hashed password
    user.token_version++;
    try {
      return await user.save(); // save object to db and pass call-back func for on-success and fail
    } catch (exception) {
      this.logger.error('UserService', 'Exception saving user', exception);
      throw exception.code ? exception : { code: 500, message: 'Error while saving user' };
    }
  }

  /**
   * Used to perform the actual password reset using a reset code and a new password
   * @param email
   * @param reset_code
   * @param new password (current will be changed to this new password)
   */
  async performResetPassword(email: string, reset_code: string, new_password: string) {
    let err, user: UserIF;
    [err, user] = await to(this.fetchByEmail(email));
    if (err) {
      this.logger.error('UserService', 'Exception fetching user by email: ' + email, err);
      throw err.code ? err : { code: 500, message: 'Error while fetching user by email' };
    }
    if (!user) {
      this.logger.error('UserService', 'User with email: ' + email + ' not found', err);
      throw err.code ? err : { code: 404, message: 'User with given email not found' };
    }
    // check that reset code is correct:
    if (
      !(
        user.reset_code &&
        reset_code == user.reset_code.reset_code && // check correct reset code
        Math.floor(Date.now() / 1000) - user.reset_code.created_at_timestamp < user.reset_code.time_to_live_seconds
      )
    ) {
      // check not expired
      this.logger.security('UserService', 'Invalid reset code. Reason: ' + (!user.reset_code || reset_code != user.reset_code.reset_code ? 'Mismatch' : 'Expired'));
      throw { code: 401, message: 'Invalid reset code' };
    }
    this.logger.info('UserService', 'Reset code valid. Resetting password');
    user.reset_code = null;
    [err] = await to(user.save());
    if (err) {
      this.logger.error('UserService', 'Error while saving user after removing reset-code from user object');
      throw err.code ? err : { code: 500, message: 'Error while saving user' };
    }
    try {
      return await this.changePassword(user, new_password);
    } catch (exception) {
      this.logger.error('UserService', 'Exception while changing password', err);
      throw err.code ? err : { code: 500, message: 'Error while changing password' };
    }
  }

  /**
   * Fetches a user by email
   */
  async fetchByEmail(email: string) {
    let err, user: UserIF;
    this.logger.info('UserService', 'Fetching user by email: ' + email);
    [err, user] = await to(this.userModel.findOne({ email: email }));
    if (err) {
      this.logger.error('UserService', 'Error while fecthing user by email: ' + email, err);
      throw err.code ? err : { code: 500, message: 'Error while fetching user' };
    }
    return user;
  }

  /**
   * Signs in the given user and returns the jwt token for that user
   */
  async login(email: string, password: string) {
    this.logger.info('UserService', 'Signing in. Email: ' + email);
    let err, user: UserIF, profiles: ProfileIF[], token: string;
    [err, user] = await to(this.fetchByEmail(email));
    if (err) {
      this.logger.error('UserService', 'Exception fetching user by email', err);
      throw err.code ? err : { code: 401, message: this.responses.unathorized };
    }
    if (!user || !(await this.hashingService.verify(password, user.password))) {
      this.logger.security('UserService', 'Login failed: unauthorized, incorrect password');
      throw { code: 401, message: this.responses.unathorized };
    }
    [err, profiles] = await to(this.profileService.fetchOwnedByCurrent({}, user));
    if (err) {
      this.logger.error('UserService', 'Exception fetching users profiles', err);
      throw err.code ? err : { code: 500, message: "Error while fetching user's profiles" };
    }
    token = this.tokenDispenser.issueBearerToken(user);

    return { token: token, profiles: profiles, user };
  }

  /**
   * Adds a new client-token for a given user
   * @param user
   * @param token
   */
  async registerClientToken(user: UserIF, token: string) {
    if (!user.client_tokens) {
      user.client_tokens = [];
    }
    if (user.client_tokens.includes(token)) {
      throw { code: 401, message: 'Client id already exists' };
    }
    user.client_tokens.push(token);
    try {
      await user.save();
    } catch (exception) {
      throw exception.code ? exception : { code: 500, message: 'Error while saving user after adding token' };
    }
  }

  /**
   * Deletes a given client-token for a given user
   * @param user
   * @param token
   */
  async removeClientToken(user: UserIF, token: string) {
    if (!user.client_tokens) {
      user.client_tokens = [];
    }
    if (!user.client_tokens.includes(token)) {
      throw { code: 404, message: 'Token not found' };
    }
    user.client_tokens = user.client_tokens.filter((client_token) => token != client_token);
    try {
      await user.save();
    } catch (exception) {
      throw exception.code ? exception : { code: 500, message: 'Error while saving user after adding token' };
    }
  }

  /**
   * Invalidates all existing bearer tokens for the given user by
   * incrementing the users token_version
   * @param user
   */
  async invalidateTokens(user: UserIF) {
    this.logger.info('UserService', 'Invalidating all bearer tokens for user: ' + user._id);
    try {
      user.token_version++;
      await user.save();
      return { message: 'success' };
    } catch (exception) {
      this.logger.error('UserService', 'Exception saving user', exception);
      throw exception.code ? exception : { code: 500, message: 'Error while saving user' };
    }
  }

  async onBoardingStripe(user: UserIF): Promise<any> {
    this.logger.info('UserService', 'Onboarding stripe express new user');
    let err, payload;

    [err, payload] = await to(this.stripeService.onBoarding(user));

    return payload;
  }

  /**
   * Creates a user from request, and returns the user or validation error response if invalid
   */

  async register(requestBody, type: UserType): Promise<RegisterUserOutDTO> {
    this.logger.info('UserService', 'Registering new user');
    let err, profile: ProfileIF, hashVal: string, new_user: UserIF, user_refreshed: UserIF, payment_account;

    try {
      if (await this.fetchByEmail(requestBody.email)) {
        this.logger.info('UserService', 'Email already exists');
        throw { code: 400, message: 'Email already exists' };
      }
    } catch (exception) {
      this.logger.error('UserService', 'Exception checking if email already exists', exception);
      throw exception.code ? exception : { code: 500, message: 'Failed to check if email already exists' };
    }
    [err, hashVal] = await to(this.hashingService.hash(requestBody.password));
    if (err) {
      this.logger.error('UserService', 'Exception hashing password', err);
      throw err.code ? err : { code: 500, message: 'Error while hashing password' };
    }
    const user = new this.userModel(requestBody);

    // Create stripe express account
    if (type === UserType.PROVIDER) {
      [err, payment_account] = await to(this.stripeService.createAccount(user.email));
      if (err) {
        this.logger.error('UserService', 'Exception unable to create express stripe account', err);
        throw err.code ? err : { code: 500, message: 'Error while creating express account' };
      }
      console.log(payment_account);
      user.payment_account = payment_account.id;
    }

    user.type = type;
    user.password = hashVal; // set password to hashed password
    [err, new_user] = await to(user.save());
    if (err) {
      this.logger.error('UserService', 'Exception saving user', err);
      throw err.code ? err : { code: 500, message: 'Error while saving user' };
    }
    [err, user_refreshed] = await to(this.fetchById(new_user._id));
    if (err) {
      this.logger.error('UserService', 'Exception fetching user after creation', err);
      throw err.code ? err : { code: 500, message: 'Error while fetching user after creation' };
    }
    try {
      return {
        user: user_refreshed,
        token: this.tokenDispenser.issueBearerToken(new_user),
      };
    } catch (exception) {
      this.logger.error('UserService', 'Exceptionissuing token', exception);
      throw { code: 500, message: 'Error while issuing token' };
    }
  }

  /**
   * Resets a given users password by email
   * @param email
   */
  async resetPassword(email: string) {
    let err, user: UserIF, reset_code: ResetCodeIF;
    [err, user] = await to(this.fetchByEmail(email));
    if (err) {
      this.logger.error('UserService', 'Exception fetching user by email: ' + email, err);
      throw err.code ? err : { code: 500, message: 'Error while fetching user by email' };
    }
    if (!user) {
      throw { code: 404, message: 'Not found' };
    }
    try {
      reset_code = {
        reset_code: await this.randomService.randomString(6),
        created_at_timestamp: Math.floor(Date.now() / 1000),
        time_to_live_seconds: 3600 * 2,
      };
    } catch (exception) {
      this.logger.error('UserService', 'Exception while generating reset_code for user. email: ' + email, exception);
      throw exception.code
        ? exception
        : {
            code: 500,
            message: 'Error while generating reset code for given user',
          };
    }
    user.reset_code = reset_code;
    [err] = await to(user.save());
    if (err) {
      this.logger.error('UserService', 'Error saving user after generating reset code');
      throw err.code
        ? err
        : {
            code: 500,
            message: 'Error saving user after generating reset code',
          };
    }
    [err] = await to(
      this.mailService.sendMail(user.email, 'Syssel Password Reset', 'Your password reset code is: ' + reset_code.reset_code + '. Please enter this in the app in order to reset your password. This code will expire in 2 hours.')
    );
    if (err) {
      this.logger.error('UserService', 'Exception while sending password reset email to: ' + user.email, err);
      throw err.code ? err : { code: 500, message: 'Error while sending password reset email' };
    }
  }

  /**
   * Gets the total number of profiles
   */
  async getCount(): Promise<number> {
    return await this.userModel.count({});
  }

  /**
   * Fetches all users that match given search criteria
   */
  async fetchAny(requestBody): Promise<FetchAllUsersOutDTO> {
    this.logger.info('UserService', 'Fetching any');
    try {
      const [totalCount, result] = await Promise.all([
        this.getCount(),
        this.queryService.orderByOffsetLimit(
          requestBody,
          this.queryService.orderByOffsetLimit(
            requestBody,
            this.queryService.filterType(
              requestBody,
              this.queryService.filterSearch(
                'email',
                requestBody,
                this.queryService.filterNewerThan(requestBody, this.queryService.filterOlderThan(requestBody, this.queryService.populateFields(UserModel.populateable(), requestBody, this.userModel.find({}))))
              )
            )
          )
        ),
      ]);
      return {
        metaData: { totalCount },
        data: result,
      };
    } catch (exception) {
      this.logger.error('UserService', 'Exception fetching any', exception);
      throw exception.code ? exception : { code: 500, message: 'Error while fetching' };
    }
  }

  /**
   * Updates a given user with new values
   */
  async update(user: UserIF) {
    this.logger.info('UserService', 'Updating user: ' + user._id);
    let err, user_saved: UserIF;
    [err] = await to(this.userModel.updateOne({ _id: user._id }, user));
    if (err) {
      this.logger.error('UserService', 'Exception updating user', err);
      throw err.code ? err : { code: 500, message: 'Error while updating user' };
    }
    [err, user_saved] = await to(this.fetchById(user._id).then());
    if (err) {
      this.logger.error('UserService', 'Exception fetching user from db after update', err);
      throw err.code
        ? err
        : {
            code: 500,
            message: 'Error while fetching user from db after update',
          };
    }
    return user_saved;
  }
}
