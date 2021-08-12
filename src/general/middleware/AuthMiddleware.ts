import ProfileIF from "../../entities/profile/ProfileIF";
import to from "await-to-js";
import ProfileService from "../../entities/profile/ProfileService";
import { UserIF, UserType } from "../../entities/user/UserIF";

/**
 * Module containing authorization middleware functions
 * TODO: SHOULD REFACTOR FOR BETTER CONSISTENCY, ALSO SHOULD ADD AN ADMIN-METHOD BOTH FOR OPTIONAL AND STRICT 
 */
export default class AuthMiddleware {
  public strict;
  public adminOrStrict;
  public optional;
  public user;
  public admin;

  constructor(
    passport,
    profileService: ProfileService,
    responseService,
    responses
  ) {
    /**
     * Returns a strict authentication function that requires both user and profile
     * (if authorization token is not present, the request will be halted with an "unathorized" response)
     */
    this.strict = async (req, res, next) => {
      let err, profile: ProfileIF;
      const unathorized = () =>
        responseService.respond(res, 401, { message: responses.unathorized });
      passport.authenticate(
        "jwt",
        { session: false },
        async (error, user: UserIF, info) => {
          if (error || !user || !req.headers.profile) {
            return unathorized();
          }
          // auth profile
          [err, profile] = await to(
            profileService.fetchById(req.headers.profile)
          );
          // check profile auth
          if (!profile || (user.type != UserType.ADMIN && (!profileService.userParticipatesIn(user, profile)))) {
            // check that current user owns profile
            return unathorized();
          }
          req.user = user;
          req.profile = profile;
          profile.last_activity = Date.now();
          try {
            await profile.save();
            next();
          } catch (exception) {
            throw exception.code
              ? exception
              : {
                code: 500,
                message: "Error while updating last-activity on profile",
              };
          }
        }
      )(req, res, next);
    };

    /**
     * Returns a strict authentication function that requires only user
     */
    this.user = function (req, res, next) {
      const unathorized = () =>
        responseService.respond(res, 401, { message: responses.unathorized });
      passport.authenticate(
        "jwt",
        { session: false },
        function (error, user: UserIF, info) {
          if (error || !user) {
            return unathorized();
          }
          req.user = user;
          next();
        }
      )(req, res, next);
    };

    /**
     * Returns an optional auth middleware
     * if authorization token is present, it will authenticate, else user will not be set
     */
    this.optional = async (req, res, next) => {
      const unathorized = () =>
        responseService.respond(res, 401, { message: responses.unathorized });
      if (req.headers.authorization && req.headers.profile) {
        return this.strict(req, res, next);
      } else {
        next();
      }
    };

    /**
      * Returns an optional auth middleware
      * if authorization token is present, it will authenticate, else user will not be set
      */
    this.adminOrStrict = async (req, res, next) => {
      const unathorized = () =>
        responseService.respond(res, 401, { message: responses.unathorized });
      if (req.headers.authorization && req.headers.profile) {
        return this.strict(req, res, next);
      } else {
        return this.admin(req, res, next);
      }
    };

    /**
     * Returns an admin auth middleware
     */
    this.admin = async (req, res, next) => {
      const unathorized = () =>
        responseService.respond(res, 401, { message: responses.unathorized });
      if (req.headers.authorization && req.headers.profile) {
        return this.strict(req, res, next);
      } else {
        passport.authenticate(
          "jwt",
          { session: false },
          function (error, user: UserIF, info) {
            if (error || !user || user.type != UserType.ADMIN) {
              return unathorized();
            }
            req.user = user;
            next();
          }
        )(req, res, next);
      }
    };
  }
}
