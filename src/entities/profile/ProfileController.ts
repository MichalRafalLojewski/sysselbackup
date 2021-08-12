import ProfileService from './ProfileService';
import UserService from '../user/UserService';
import GeneralModelService from '../../general/services/GeneralModelService';
import ResponseService from '../../general/services/ResponseService';
import Responses from '../../general/consts/Responses';
import ProfileIF from './ProfileIF';
import { UserIF, UserType } from '../user/UserIF';
import RequestOutIF from '../RequestOutIF';
import ItemIF from '../item/ItemIF';
import ItemService from '../item/ItemService';
import { FetchAllProfilesOutDTO } from './DTOs/FetchProfilesDTO';
import to from 'await-to-js';

/**
 * Controller module for profile requests.
 * contains controller-functions which are mapped to by item-related routes
 */
export default class ProfileController {
  private profileService: ProfileService;
  private userService: UserService;
  private generalModelService: GeneralModelService;
  private responseService: ResponseService;
  private responses: Responses;
  private itemService: ItemService;
  constructor(profileService: ProfileService, userService: UserService, generalModelService: GeneralModelService, responseService: ResponseService, responses: Responses, itemService: ItemService) {
    this.profileService = profileService;
    this.userService = userService;
    this.generalModelService = generalModelService;
    this.responseService = responseService;
    this.responses = responses;
    this.itemService = itemService;
  }

  /**
   * Creates an micro-comapny from request, and returns the object or validation error response if invalid
   */
  create(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (profile: ProfileIF) => me.responseService.respond(res, 200, profile);
    me.profileService.create(req.body, req.user).then(ok).catch(anyErr);
  }

  /**
   * Transfer profile ownership
   */
  transferOwner(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (profile: ProfileIF) => me.responseService.respond(res, 200, profile);

    me.userService
      .fetchById(req.body.user_id)
      .then(function (user) {
        if (!user || user.deleted) throw { code: 404, message: 'Selected user not found ! ' }; // user deleted already
        return me.profileService.transferOwner(req.body, req.user);
      })
      .then(ok)
      .catch(anyErr);
  }

  /**
   * Fetch profiles owned by current User
   */
  fetchOwnedByCurrent(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (profiles: ProfileIF[]) => me.responseService.respond(res, 200, profiles);

    return me.profileService.fetchOwnedByCurrent({}, req.user).then(ok).catch(anyErr);
  }

  /**
   * Fetches a given profile by id
   */
  fetchById(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (profile: ProfileIF) => me.responseService.respond(res, 200, profile);
    me.profileService
      .fetchById(req.params.id, req.query)
      .then(function (profile) {
        const can_edit: boolean = me.generalModelService.userCanEditObj(req.user, profile);
        if (!(profile && (profile.active || (req.user && can_edit)))) {
          // if campaign active, allow anyone to view, else, check if user has edit privliges
          return anyErr({ code: 404, message: 'Not found' });
        }
        if (can_edit) {
          profile = profile.withFavoritesJSON(req.query.include_favorite_items, req.query.include_favorite_profiles);
        }
        ok(profile);
      })
      .catch(anyErr);
  }

  /**
   * Fetches all profiles current user participates in
   * offers order by, limit, offset
   */
  fetchByCurrent(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (profiles: ProfileIF[]) => this.responseService.respond(res, 200, profiles);
    this.profileService.fetchByCurrent(req.query, req.user).then(ok).catch(anyErr);
  }

  /**
   * Fetches all profiles current user participates in
   * offers order by, limit, offset
   */
  fetchAny(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (profiles: FetchAllProfilesOutDTO) => this.responseService.respond(res, 200, profiles);
    this.profileService.fetchAny(req.query).then(ok).catch(anyErr);
  }

  /**
   * Deletes a given profile by id
   */
  delete(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = () => this.responseService.respond(res, 200, { message: me.responses.success });
    me.profileService
      .fetchById(req.params.id)
      .then(function (profile: ProfileIF) {
        // fetch
        if (!profile) {
          // check exists
          return anyErr({ code: 404, message: 'Not found' });
        }
        if (!me.generalModelService.userCanEditObj(req.user, profile)) {
          //check access
          return anyErr({ code: 401, message: 'Unauthorized' });
        }
        me.profileService.deleteById(profile._id).then(ok).catch(anyErr);
      })
      .catch(anyErr);
  }

  /**
   * Updates a given profile with values from request
   */
  async update(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (profile: ProfileIF) => this.responseService.respond(res, 200, profile);
    let err, profile: ProfileIF;
    [err, profile] = await to(this.profileService.fetchById(req.body._id));
    if (err) {
      return anyErr(err);
    }
    if (!profile) {
      return anyErr({ code: 404, message: 'Not found' });
    }
    if (!this.generalModelService.userCanEditObj(req.user, profile)) {
      //check access
      return anyErr({ code: 401, message: 'Unauthorized' });
    }
    delete req.body._id;
    this.profileService.update(profile, req.body).then(ok).catch(anyErr);
  }

  /**
   * Adds a given user to a given micro-comapny
   */
  addUser(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (profile: ProfileIF) => this.responseService.respond(res, 200, { message: 'success' });
    this.userService
      .fetchById(req.body.user_id)
      .then(function (user: UserIF) {
        if (!user) {
          return anyErr({ code: 404, message: 'User not found' });
        }
        me.profileService
          .fetchById(req.body.profile_id)
          .then(function (profile) {
            if (!profile) {
              return anyErr({ code: 404, message: 'Profile not found' });
            }
            if (!me.generalModelService.userCanEditObj(req.user, profile)) {
              //check access
              return anyErr({ code: 401, message: 'Unauthorized' });
            }
            me.profileService.addUser(profile, user).then(ok).catch(anyErr);
          })
          .catch(anyErr);
      })
      .catch(anyErr);
  }

  // FAVORITES:
  /**
   * Adds a profile to favrotites
   * @param req
   * @param res
   */
  addProfileToFavorites(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (profile) => this.responseService.respond(res, 200, { message: 'success' });
    this.profileService
      .fetchById(req.body.id)
      .then(function (profile: ProfileIF) {
        // fetch
        if (!profile) {
          // check exists
          return anyErr({ code: 404, message: 'Profile not found' });
        }
        me.profileService.addProfileToFavorites(req.profile, profile).then(ok).catch(anyErr);
      })
      .catch(anyErr);
  }

  /**
   * Removes a profile from favorites
   * @param req
   * @param res
   */
  removeProfileFromFavorites(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (response: RequestOutIF) => me.responseService.respond(res, 200, { message: 'success' });
    me.profileService
      .fetchById(req.body.id)
      .then(function (profile: ProfileIF) {
        // fetch
        if (!profile) {
          // check exists
          return anyErr({ code: 404, message: 'Not found' });
        }
        me.profileService.removeProfileFromFavorites(req.profile, profile).then(ok).catch(anyErr);
      })
      .catch(anyErr);
  }

  /**
   * Adds an item to favorites
   * @param req
   * @param res
   */
  addItemToFavorites(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = () => me.responseService.respond(res, 200, { message: 'success' });
    me.itemService
      .fetchById(req.body.id)
      .then(function (item: ItemIF) {
        // fetch
        if (!item) {
          // check exists
          return anyErr({ code: 404, message: 'Not found' });
        }
        me.profileService.addItemToFavorites(req.profile, item).then(ok).catch(anyErr);
      })
      .catch(anyErr);
  }

  /**
   * Removes an item from favorites
   * @param req
   * @param res
   */
  removeItemFromFavorites(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = () => me.responseService.respond(res, 200, { message: 'success' });
    me.itemService
      .fetchById(req.body.id)
      .then(function (item: ItemIF) {
        // fetch
        if (!item) {
          // check exists
          return anyErr({ code: 404, message: 'Not found' });
        }
        me.profileService.removeItemFromFavorites(req.profile, item).then(ok).catch(anyErr);
      })
      .catch(anyErr);
  }

  /**
   * Fetches profiles from current profiles favorites
   */
  fetchFavoriteProfiles(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (profiles: ProfileIF[]) => me.responseService.respond(res, 200, profiles);
    me.profileService.fetchByIds(req.profile.favorite_profiles, req.query).then(ok).catch(anyErr);
  }

  /**
   * Fetches profiles from current profiles favorites
   */
  fetchFavoriteItems(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (items: ItemIF[]) => me.responseService.respond(res, 200, items);
    me.itemService.fetchByIds(req.profile.favorite_items, req.query).then(ok).catch(anyErr);
  }
}
