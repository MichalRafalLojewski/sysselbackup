import UserService from './UserService';
import Responses from '../../general/consts/Responses';
import ResponseService from '../../general/services/ResponseService';
import { UserIF, UserType } from './UserIF';
import HashingService from '../../general/services/HashingService';
import RequestOutIF from '../RequestOutIF';
import { FetchAllUsersOutDTO } from './DTOs/FetchUsersDTO';
import ProfileService from '../profile/ProfileService';
import { RegisterBothOutDTO } from './DTOs/RegisterBothOutDTO';
import ProfileIF from '../profile/ProfileIF';
import { RegisterUserOutDTO } from './DTOs/RegisterUserOutDTO';

/**
 * Controller module for user-related requests.
 * contains controller-functions which are mapped to by user-related routes
 */
export default class UserController {
  private userService: UserService;
  private responses: Responses;
  private responseService: ResponseService;
  private hashingService: HashingService;
  private profileService: ProfileService;
  constructor(userService: UserService, profileService: ProfileService, responses: Responses, hashingService: HashingService, responseService: ResponseService) {
    this.userService = userService;
    this.responses = responses;
    this.responseService = responseService;
    this.hashingService = hashingService;
    this.profileService = profileService;
  }

  // :::: NORMAL || ADMIN || PROVIDER ::::
  /**
   * Signs in the given user and returns the jwt token for that user along with user info
   */
  login(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (response) => this.responseService.respond(res, 200, response);
    this.userService.login(req.body.email, req.body.password).then(ok).catch(anyErr);
  }

  /**
   * Creates a provider user from request, and returns the user or validation error response if invalid
   */
  registerProvider(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (response) => this.responseService.respond(res, 200, response);
    this.userService.register(req.body, UserType.PROVIDER).then(ok).catch(anyErr);
  }

  /**
   * Creates a user stripe express account onboarding
   */
  onBoarding(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (response) => this.responseService.respond(res, 200, response);
    this.userService.onBoardingStripe(req.user).then(ok).catch(anyErr);
  }

  /**
   * Creates a user from request, and returns the user or validation error response if invalid
   */
  register(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (response) => this.responseService.respond(res, 200, response);
    this.userService.register(req.body, UserType.NORMAL).then(ok).catch(anyErr);
  }

  /**
   * Creates both a user and a profile at the same time
   * (used tow avoid separate endpoints as part of frontend signup)
   */
  async registerBoth(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (response: RegisterBothOutDTO) => this.responseService.respond(res, 200, response);
    try {
      const registerUserOut: RegisterUserOutDTO = await this.userService.register(req.body.user, UserType.NORMAL);
      const { user, token } = registerUserOut;
      const profile: ProfileIF = await this.profileService.create(req.body.profile, user);
      return ok({
        user,
        profile,
        token,
      });
    } catch (err) {
      return anyErr(err);
    }
  }

  /**
   * Fetches any (suggested) items
   */
  fetchAny(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (users: FetchAllUsersOutDTO) => this.responseService.respond(res, 200, users);
    this.userService.fetchAny(req.query).then(ok).catch(anyErr);
  }

  /**
   * Changes the current users password
   */
  changePassword(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = () => this.responseService.respond(res, 200, { message: this.responses.success });
    this.hashingService.verify(req.body.old_password, req.user.password).then((correct: boolean) => {
      if (!correct) {
        return anyErr({ code: 401, message: 'Password not correct' });
      }
      me.userService.changePassword(req.user, req.body.new_password).then(ok).catch(anyErr);
    });
  }

  /**
   * Invalidates all existing bearer tokens of current-user
   */
  invalidateTokens(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = () => this.responseService.respond(res, 200, { message: 'success' });
    this.userService.invalidateTokens(req.user).then(ok).catch(anyErr);
  }

  /**
   * Updates current user
   */
  update(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (user: UserIF) => this.responseService.respond(res, 200, user);
    if (req.body._id.toString() != req.user._id.toString()) {
      return anyErr({ code: 401, message: 'Unauthorized' });
    }
    this.userService.update(req.body).then(ok).catch(anyErr);
  }

  /**
   * Returns the currently signed in user
   */
  fetch(
    req,
    res // fetches current user
  ) {
    this.responseService.respond(res, 200, req.user.toJSON_PRIVATE()); // error when hashing password, respond internal server error
  }

  /**
   * Fetch a given user by id
   */
  fetchById(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (user: UserIF) => this.responseService.respond(res, 200, user);
    this.userService
      .fetchById(req.params.id, req.query)
      .then(function (user: UserIF) {
        if (!user) {
          return anyErr({ code: 404, message: 'Not found' });
        }
        ok(user);
      })
      .catch(anyErr);
  }

  /**
   * Adds a new client-token for current user
   */
  registerClientToken(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = () => this.responseService.respond(res, 200, { message: 'success' });
    this.userService.registerClientToken(req.user, req.body.token).then(ok).catch(anyErr);
  }

  /**
   * Removes a given client-token for current user
   */
  removeClientToken(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = () => this.responseService.respond(res, 200, { message: 'success' });
    this.userService.removeClientToken(req.user, req.params.token).then(ok).catch(anyErr);
  }

  /**
   * Resets a given users password by email
   */
  resetPassword(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = () => this.responseService.respond(res, 200, { message: 'success' });
    this.userService.resetPassword(req.body.email).then(ok).catch(anyErr);
  }

  /**
   * Performs password-change using a reset code and a new password
   * @param req
   * @param res
   */
  performPasswordReset(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (u) => this.responseService.respond(res, 200, u);
    this.userService.performResetPassword(req.body.email, req.body.reset_code, req.body.new_password).then(ok).catch(anyErr);
  }
}
