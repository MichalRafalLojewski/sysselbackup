import QueryService from '../../general/services/QueryService';
import { UserIF } from '../user/UserIF';
import ProfileIF from './ProfileIF';
import Profile from './Profile';
import ItemIF from '../item/ItemIF';
import GeneralModelService from '../../general/services/GeneralModelService';
import FileService from '../file/FileService';
import to from 'await-to-js';
import LoggerIF from '../../general/loggers/LoggerIF';
import { EventIF } from '../event/EventIF';
import PaymentOptionIF from './PaymentOptionIF';
import RandomService from '../../general/services/RandomService';
import { ProfileParticipantWrappedDTO } from './DTOs/ProfileParticipantDTO';
import { FetchAllProfilesOutDTO } from './DTOs/FetchProfilesDTO';
import FileIF from '../file/FileIF';
import GeneralEntityService from '../../general/services/GeneralEntityService';

export default class ProfileService {
  private profileModel;
  private itemModel;
  private campaignModel;
  private queryService: QueryService;
  private generalModelService: GeneralModelService;
  private fileService: FileService;
  private randomService: RandomService;
  private logger: LoggerIF;
  private generalEntityService: GeneralEntityService;

  constructor(
    profileModel,
    itemModel,
    campaignModel,
    queryService: QueryService,
    generalModelService: GeneralModelService,
    fileService: FileService,
    randomService: RandomService,
    logger: LoggerIF,
    generalEntityService: GeneralEntityService
  ) {
    this.profileModel = profileModel;
    this.itemModel = itemModel;
    this.campaignModel = campaignModel;
    this.queryService = queryService;
    this.generalModelService = generalModelService;
    this.fileService = fileService;
    this.randomService = randomService;
    this.logger = logger;
    this.generalEntityService = generalEntityService;
  }

  /**
   * Checks if the given object is a profile
   */
  isProfile(obj): boolean {
    return obj instanceof this.profileModel;
  }

  /**
   * Gets the total number of profiles
   */
  async getCount(): Promise<number> {
    return await this.profileModel.count({});
  }

  /**
   * Fetches a given profile by id
   */
  async fetchById(id, requestBody = {}): Promise<ProfileIF> {
    this.logger.info('ProfileService', 'Fetching profile by id: ' + id);
    try {
      return await this.queryService.populateFields(Profile.populateable(), requestBody, this.profileModel.findOne({ _id: id }));
    } catch (exception) {
      this.logger.error('ProfileService', 'Exception while fetching profile', exception);
      throw exception.code ? exception : { code: 500, message: 'Error while fetching profile' };
    }
  }

  /**
   * Fetches profiles by array of profile ids
   */
  async fetchByIds(ids: any[], requestBody = {}): Promise<ProfileIF[]> {
    this.logger.info('ProfileService', 'Fetching profiles by ids');
    try {
      return await this.queryService.orderByOffsetLimit(
        requestBody,
        this.queryService.filterNewerThan(
          requestBody,
          this.queryService.filterOlderThan(
            requestBody,
            this.queryService.filterHasCategory(
              requestBody,
              this.queryService.filterSearch(
                'title',
                requestBody,
                this.queryService.filterNear(
                  requestBody,
                  this.queryService.filterHasCampaigns(
                    requestBody,
                    this.queryService.filterHasItems(
                      requestBody,
                      this.queryService.filterType(
                        requestBody,
                        this.queryService.populateFields(
                          Profile.populateable(),
                          requestBody,
                          this.profileModel.find({ _id: [...new Set(ids)] }) // find all conversations where current user is a participant
                        )
                      )
                    )
                  )
                )
              )
            )
          )
        )
      );
    } catch (exception) {
      this.logger.error('ProfileService', 'Exception fetching by ids: ' + ids, exception);
      throw exception.code ? exception : { code: 500, message: 'Error while fetching' };
    }
  }

  /**
   * Fetches the all profiles that participate in a given list of events, sorted by event created_at
   * @param events
   * @param requestBody
   */
  async fetchEventParticipants(events: EventIF[], requestBody?): Promise<ProfileParticipantWrappedDTO[]> {
    let err,
      profiles: ProfileIF[],
      profile_ids: any[] = [],
      last_event_map = {};
    events.forEach((event) => {
      (event.participants || [])
        .map((participant) => participant._id.toString())
        .forEach((id) => {
          if (!profile_ids.includes(id)) {
            profile_ids.push(id);
          }
        });
      (event.participants || [])
        .map((participant) => participant._id.toString())
        .filter((id) => !last_event_map[id])
        .forEach((id) => (last_event_map[id] = event.created_at));
    });
    [err, profiles] = await to(this.fetchByIds(profile_ids, requestBody)); // NOTE: Includes offset,limit so output size might be different from profile_ids
    if (err) {
      this.logger.error('ProfileService', 'Exception fetching by ids: ' + profile_ids, err);
      throw err.code ? err : { code: 500, message: 'Error while fetching' };
    }
    [err, profiles] = await to(
      this.generalModelService.sortByOrder<ProfileIF>(
        profiles,
        profile_ids.filter((id) => profiles.map((profile) => profile._id.toString()).includes(id))
      )
    );
    if (err) {
      throw err.code ? err : { code: 500, message: 'Error while sorting profiles' };
    }
    return profiles
      ? profiles.map((profile) => ({
          last_event: last_event_map[profile._id.toString()],
          profile,
        }))
      : [];
  }

  /**
   * Fetches all profiles current user participates in
   * offers order by, limit, offset
   */
  async fetchByCurrent(requestBody, current_user: UserIF): Promise<ProfileIF[]> {
    this.logger.info('ProfileService', 'Fetching profiles current user participates in. Current user: ' + current_user._id);
    try {
      return await this.queryService.orderByOffsetLimit(
        requestBody,
        this.queryService.filterParticipant(
          requestBody,
          this.queryService.filterNewerThan(
            requestBody,
            this.queryService.filterOlderThan(
              requestBody,
              this.queryService.filterHasCategory(
                requestBody,
                this.queryService.filterSearch(
                  'title',
                  requestBody,
                  this.queryService.filterNear(
                    requestBody,
                    this.queryService.filterHasCampaigns(
                      requestBody,
                      this.queryService.filterHasItems(
                        requestBody,
                        this.queryService.filterType(
                          requestBody,
                          this.queryService.populateFields(
                            Profile.populateable(),
                            requestBody,
                            this.profileModel.find({
                              participants: current_user._id,
                            }) // find all conversations where current user is a participant
                          )
                        )
                      )
                    )
                  )
                )
              )
            )
          )
        )
      );
    } catch (exception) {
      this.logger.error('ProfileService', 'Exception fetching', exception);
      throw exception.code ? exception : { code: 500, message: 'Error while fetching' };
    }
  }

  /**
   * Fetches all profiles current user owns
   * offers order by, limit, offset
   */
  async fetchOwnedByCurrent(requestBody, current_user: UserIF): Promise<ProfileIF[]> {
    this.logger.info('ProfileService', 'Fetching profiles owned by current user. Current user: ' + current_user._id);
    try {
      return await this.queryService.orderByOffsetLimit(
        requestBody,
        this.queryService.filterParticipant(
          requestBody,
          this.queryService.filterNewerThan(
            requestBody,
            this.queryService.filterOlderThan(
              requestBody,
              this.queryService.filterHasCategory(
                requestBody,
                this.queryService.filterSearch(
                  'title',
                  requestBody,
                  this.queryService.filterHasCampaigns(
                    requestBody,
                    this.queryService.filterNotDeleted(
                      requestBody,
                      this.queryService.filterHasItems(
                        requestBody,
                        this.queryService.filterNear(
                          requestBody,
                          this.queryService.filterType(
                            requestBody,
                            this.queryService.populateFields(
                              Profile.populateable(),
                              requestBody,
                              this.profileModel.find({ owner: current_user._id }) // find all conversations where current user is a participant
                            )
                          )
                        )
                      )
                    )
                  )
                )
              )
            )
          )
        )
      );
    } catch (exception) {
      this.logger.error('ProfileService', 'Exception fetching', exception);
      throw exception.code ? exception : { code: 500, message: 'Error while fetching' };
    }
  }

  /**
   * Fetches all profiles matching criteria
   * @param current_profile
   * @param requestBody
   */
  async fetchAny(requestBody): Promise<FetchAllProfilesOutDTO> {
    this.logger.info('ProfileService', 'Fetching any profiles (reccomended)');
    try {
      const [totalCount, result] = await Promise.all([
        this.getCount(),
        this.queryService.filterNear(
          requestBody,
          this.queryService.orderByOffsetLimit(
            requestBody,
            this.queryService.filterActive(
              requestBody,
              this.queryService.filterSearch(
                'title',
                requestBody,
                this.queryService.filterNewerThan(
                  requestBody,
                  this.queryService.filterOlderThan(
                    requestBody,
                    this.queryService.filterHasCategory(
                      requestBody,
                      this.queryService.filterHasCampaigns(
                        requestBody,
                        this.queryService.filterHasItems(
                          requestBody,
                          this.queryService.filterType(requestBody, this.queryService.filterNotDeleted(requestBody, this.queryService.populateFields(Profile.populateable(), requestBody, this.profileModel.find({}))))
                        )
                      )
                    )
                  )
                )
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
      this.logger.error('ProfileService', 'Exception fetching', exception);
      throw exception.code ? exception : { code: 500, message: 'Error while fetching' };
    }
  }

  /**
   * Transfer Ownership from admin to the user
   */

  async transferOwner(body: any, user: UserIF): Promise<ProfileIF> {
    this.logger.info('ProfileService', 'Transferring Ownership: ' + body.profile_id);
    let err, profile: ProfileIF;

    [err, profile] = await to(this.fetchById(body.profile_id));

    if (err) {
      this.logger.error('ProfileService', 'Error fetching profile', err);
      throw err.code ? err : { code: 500, message: 'Error while fetching profile' };
    }

    if (String(profile.owner) !== String(user._id)) {
      throw { code: 401, message: 'Unauthenticated transfer , you are not the owner of profile' };
    }

    // Brand New Entity
    profile.owner = body.user_id;
    profile.participants = [body.user_id];
    await to(profile.save());

    // transfer successful
    return profile;
  }

  /**
   * Creates an profile from request, and returns the object or validation error response if invalid
   */
  async create(requestBody: ProfileIF, current_user: UserIF): Promise<ProfileIF> {
    this.logger.info('ProfileService', 'Creating new profile. current_user: ' + current_user._id);
    let err, profile_saved: ProfileIF;
    // create and store campaign
    const model = new this.profileModel(requestBody);
    model.owner = current_user._id; // set owner to current user
    model.active = true;
    model.favorite_items = [];
    model.favorite_profiles = [];
    model.favorited_count = 0;
    if (requestBody.participants) {
      // add current user/owner to participants
      model.participants = requestBody.participants;
      if (!model.participants.includes(current_user._id)) {
        model.participants.push(current_user._id);
      }
    } else {
      model.participants = [current_user._id];
    }
    if (requestBody.payment_options) {
      let index = 0;
      model.payment_options = requestBody.payment_options.map(
        (option: PaymentOptionIF): PaymentOptionIF => ({
          ...option,
          id: this.randomService.randomStringSync(7) + '_i' + index++,
        })
      );
    }
    [err, profile_saved] = await to(model.save()); // save object to db and pass call-back func for on-success and fail
    if (err) {
      this.logger.error('ProfileService', 'Exception saving profile', err);
      throw err.code ? err : { code: 500, message: 'Error while saving profile' };
    }
    return profile_saved;
  }

  /**
   * Updates the location all items owned by profile to match owner profile
   * @param profile
   */
  async syncLocationsToProfile(profile: ProfileIF, ormModels: any[]) {
    this.logger.info('ProfileService', 'Syncing locations to owner profile: ' + profile._id);
    try {
      await Promise.all(ormModels.map((model) => model.updateMany({ owner_profile: { _id: profile._id } }, { location: profile.location })));
    } catch (exception) {
      this.logger.error('ProfileService', 'Exception while updating items', exception);
      throw exception.code ? exception : { code: 500, message: 'Error while updating ' };
    }
    return true;
  }

  async deleteFiles(profile: ProfileIF) {
    let err, files: FileIF[];
    const file_ids = [...(profile.other_pics || []), ...(profile.front_pic ? [profile.front_pic] : [])].map((file) => file._id);
    this.logger.info('ProfileService', 'Deleting attached files: ' + file_ids);
    [err, files] = await to(this.fileService.fetchByIds(file_ids));
    [err] = await to(this.fileService.deleteMultiple(profile, files));
    if (err) {
      this.logger.error('ItemService', 'Exception deleting attached files by ids', err);
      throw err.code ? err : { code: 500, message: 'Error while deleting other_files during post-logic' };
    }
  }

  /**
   * Deletes a given profile by id
   * NOTE: Might be improved... fetches the given model twice from db
   */
  async deleteById(id) {
    this.logger.info('ProfileService', 'Deleting profile by id: ' + id);
    let err, profile: ProfileIF;
    [err, profile] = await to(this.fetchById(id));
    if (err) {
      this.logger.info('ProfileService', 'Exception fetching profile with id: ' + id, err);
      throw err.code ? err : { code: 500, message: 'Error while profile with id: ' + id };
    }
    if (!profile) {
      this.logger.info('ProfileService', 'Profile not found: ' + id, err);
      throw err.code ? err : { code: 500, message: 'Profile not found ' + id };
    }
    profile.deleted = true;
    [err] = await to(profile.save());
    if (err) {
      this.logger.info('ProfileService', 'Exception saving changes to profile', err);
      throw err.code ? err : { code: 500, message: 'Error while deleting profile' };
    }
    [err] = await to(this.deleteFiles(profile));
    if (err) {
      this.logger.error('ProfileService', 'Error deleting attached files', err);
      throw err.code ? err : { code: 500, message: 'Error deleting attached files' };
    }
    return { message: 'success' };
  }

  location_changed(obj_old: ProfileIF, obj_new: ProfileIF): boolean {
    let old_coordinates = [null, null],
      new_coordinates = [null, null];
    if (obj_old.location && obj_old.location.coordinates) {
      old_coordinates = obj_old.location.coordinates;
    }
    if (obj_new.location && obj_new.location.coordinates) {
      new_coordinates = obj_new.location.coordinates;
    }
    // missing location before change, now has location
    return (
      old_coordinates[0] != new_coordinates[0] || // x mismatch
      old_coordinates[1] != new_coordinates[1]
    ); // y mismatch
  }

  /**
   * Updates a given item with values
   */
  async update(current_profile: ProfileIF, newBody): Promise<ProfileIF> {
    this.logger.info('ProfileService', 'Updating profile: ' + current_profile._id);
    let err, profile_saved: ProfileIF, deleted_orphaned_files: string[];
    const post_logic = async (profile: ProfileIF, obj_old: ProfileIF, obj_new: ProfileIF) => {
      // update location of referenced objects:
      if (this.location_changed(obj_old, obj_new)) {
        // check if gps coordinates changed from old to new
        [err] = await to(this.syncLocationsToProfile(obj_new, [this.itemModel, this.campaignModel]));
        if (err) {
          this.logger.error('ProfileService', 'Exception updating location on referenced models', err);
          throw err.code
            ? err
            : {
                code: 500,
                message: 'Error while updating location on referenced models',
              };
        }
      }
      // delete removed pictures:
      [err, deleted_orphaned_files] = await to(this.fileService.deleteOrpahnedFiles(profile, obj_old, obj_new));
      if (err) {
        this.logger.error('ProfileService', 'Exception deleting orphaned files during post-logic', err);
        throw err.code
          ? err
          : {
              code: 500,
              message: 'Error while deleting orphaned files during post-logic',
            };
      }
    };
    if (newBody.payment_options) {
      let index = 0;
      newBody.payment_options = newBody.payment_options.map(
        (option: PaymentOptionIF): PaymentOptionIF => ({
          ...option,
          id: option.id ? option.id : this.randomService.randomStringSync(7) + '_i' + index++,
        })
      );
    }
    [err] = await to(this.generalEntityService.validatePictureBody(newBody, current_profile));
    if (err) {
      this.logger.error('ItemService', 'Valdiation or auth error for pictures', err);
      throw err.code ? err : { code: 400, message: 'Error validating pictures' };
    }
    [err] = await to(this.profileModel.updateOne({ _id: current_profile._id }, newBody));
    if (err) {
      this.logger.error('ProfileService', 'Exception updating profile', err);
      throw err ? err : { code: 500, message: 'Error while updating profile' };
    }
    [err, profile_saved] = await to(this.fetchById(current_profile._id));
    if (err) {
      this.logger.error('ProfileService', 'Exception fetching after update', err);
      throw err.code ? err : { code: 500, message: 'Error while fetching after update' };
    }
    [err] = await to(post_logic(current_profile, current_profile, profile_saved));
    if (err) {
      this.logger.error('ProfileService', 'Exception during post-logic', err);
      throw err.code ? err : { code: 500, message: 'Error during post-logic' };
    }
    try {
      return await this.fetchById(current_profile._id);
    } catch (exception) {
      this.logger.error('ProfileService', 'Exception fetching profile after update', err);
      throw exception.code ? exception : { code: 500, message: 'Error while fetching profile after update' };
    }
  }

  /**
   * Checks if the given user participates in the given profile
   */
  userParticipatesIn(user, profile: ProfileIF): boolean {
    return profile.participants.map((user) => user._id.toString()).includes(user._id.toString());
  }

  /**
   * Adds a given user as participant to a profile
   */
  async addUser(profile: ProfileIF, user: UserIF): Promise<ProfileIF> {
    this.logger.info('ProfileService', 'Adding user: ' + user._id + ' to profile: ' + profile._id);
    let err, profile_saved: ProfileIF;
    if (this.userParticipatesIn(user, profile)) {
      return profile;
    }
    profile.participants.push(user._id);
    [err, profile_saved] = await to(profile.save());
    if (err) {
      this.logger.error('ProfileService', 'Exception saving profile', err);
      throw err.code ? err : { code: 500, message: 'Error while saving profile' };
    }
    return profile_saved;
  }

  // FAVORITES:
  /**
   * Adds a profile item to the profiles favorites
   * @param profile
   * @param profile_to_add
   */
  async addProfileToFavorites(profile: ProfileIF, target_profile: ProfileIF) {
    this.logger.info('ProfileService', 'Adding profile to favorites. Source profile: ' + profile._id + ', target profile: ' + target_profile._id);
    let err;
    if (profile.owner._id.toString() == target_profile.owner._id.toString()) {
      this.logger.security('ProfileService', 'Cant add own profile to favorites');
      throw { code: 403, message: 'Cant add own profile to favorites' };
    }
    if (!profile.favorite_profiles) {
      // initialize array if not already
      profile.favorite_profiles = [];
    }
    if (profile.favorite_profiles.includes(target_profile._id)) {
      this.logger.info('ProfileService', 'Profile already in favorites');
      throw { code: 400, message: 'Profile already in favorites' };
    }
    profile.favorite_profiles.push(target_profile._id);
    target_profile.favorited_count++;
    [err] = await to(profile.save());
    if (err) {
      this.logger.info('ProfileService', 'Exception saving current profile', err);
      throw err.code ? err : { code: 500, message: 'Error while saving current profile' };
    }
    [err] = await to(target_profile.save());
    if (err) {
      this.logger.error('ProfileService', 'Exception saving target profile', err);
      throw err.code ? err : { code: 500, message: 'Error while saving target profile' };
    }
    return { message: 'success' };
  }

  /**
   * Adds a given item to the profiles favorites
   * @param profile
   * @param item
   */
  async addItemToFavorites(profile: ProfileIF, item: ItemIF) {
    this.logger.info('ProfileService', 'Adding item to favorites. Item: ' + item._id + ', profile: ' + profile._id);
    let err;
    if (profile.owner._id.toString() == item.owner_profile.owner._id.toString()) {
      this.logger.security('ProfileService', 'Cant add own items to favorite');
      throw { code: 403, message: 'Cant add own items to favorite' };
    }
    if (!profile.favorite_items) {
      profile.favorite_items = [];
    }
    if (profile.favorite_items.includes(item._id)) {
      this.logger.info('ProfileService', 'Item already in favorites');
      throw { code: 400, message: 'Item already in favorites' };
    }
    profile.favorite_items.push(item._id);
    item.favorited_count++;
    [err] = await to(profile.save());
    if (err) {
      this.logger.error('ProfileService', 'Exception saving current profile', err);
      throw err.code ? err : { code: 500, message: 'Error while saving current profile' };
    }
    [err] = await to(item.save());
    if (err) {
      this.logger.error('ProfileService', 'Exception saving item', err);
      throw err.code ? err : { code: 500, message: 'Error while saving item' };
    }
    return { message: 'success' };
  }

  /**
   * Removes a given item to the profiles favorites
   * @param profile
   * @param item
   */
  async removeItemFromFavorites(profile: ProfileIF, item: ItemIF) {
    this.logger.info('ProfileService', 'Removing item from favorites. Item: ' + item._id + ', profile: ' + profile._id);
    let err;
    if (!profile.favorite_items || !profile.favorite_items.includes(item._id)) {
      this.logger.info('ProfileService', 'Item not in favorites');
      throw { code: 404, message: 'Item not in favorites' };
    }
    profile.favorite_items = profile.favorite_items.filter((item_id) => item_id.toString() != item._id.toString());
    item.favorited_count--;
    [err] = await to(profile.save());
    if (err) {
      this.logger.error('ProfileService', 'Exception while saving current profile', err);
      throw err.code ? err : { code: 500, message: 'Error while saving current profile' };
    }
    [err] = await to(item.save());
    if (err) {
      this.logger.error('ProfileService', 'Exception saving item', err);
      throw err.code ? err : { code: 500, message: 'Error while saving item' };
    }
    return { message: 'success' };
  }

  /**
   * Removes a given item to the profiles favorites
   * @param profile
   * @param item
   */
  async removeProfileFromFavorites(profile: ProfileIF, target_profile: ProfileIF) {
    this.logger.info('ProfileService', 'Removing profile from favorites. Profile: ' + profile._id + ', target_profile: ' + target_profile._id);
    let err;
    if (!profile.favorite_profiles || !profile.favorite_profiles.includes(target_profile._id)) {
      throw { code: 404, message: 'Profile not in favorites' };
    }
    profile.favorite_profiles = profile.favorite_profiles.filter((profile_id) => profile_id.toString() != target_profile._id.toString());
    target_profile.favorited_count--;
    [err] = await to(profile.save());
    if (err) {
      this.logger.error('ProfileService', 'Exception while saving current profile', err);
      throw err.code ? err : { code: 500, message: 'Error while saving current profile' };
    }
    [err] = await to(target_profile.save());
    if (err) {
      this.logger.error('ProfileService', 'Exception while saving target profile', err);
      throw err.code ? err : { code: 500, message: 'Error while saving target profile' };
    }
    return { message: 'success' };
  }
}
