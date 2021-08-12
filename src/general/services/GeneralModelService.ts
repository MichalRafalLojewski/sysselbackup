import ProfileIF from "../../entities/profile/ProfileIF";
import { MongodbEntityIF } from "../../entities/MongodbEntityIF";
import { UserType } from "../../entities/user/UserIF";

/**
* Module for providing general helper-methods for mongoose model operations
*/
export default class GeneralModelService {

  /**
  * Sorts an array of db-opbjects by the order of a list of object-ids
  * (used to guarantee order of items)
  * @param profiles 
  */
  async sortByOrder<T extends MongodbEntityIF>(objs: T[], ordered_profile_ids: any[]): Promise<T[]> {
    const objMap = {};
    objs.forEach(obj => {
      objMap[obj._id.toString()] = obj;
    });
    return ordered_profile_ids.map(obj_id => objMap[obj_id]);
  }

  /**
   * Takes an object as parameter and finds the owner id
   * @param {*} obj 
   */
  ownerUserId(obj): string {
    return (obj.owner._id ? obj.owner._id : obj.owner).toString();
  }
  /**
  * Checks if the given profile owns a given model-instance
  */
  profileOwnsObj(profile: ProfileIF, obj: MongodbEntityIF): boolean {
    return obj.owner_profile._id ? (obj.owner_profile._id.toString() == profile._id.toString()) : // if owner_profile is loaded
      (obj.owner_profile.toString() == profile._id.toString());
  };

  /**
  * Checks if the given profile can edit a given model-instance
  */
  profileCanEditObj(profile: ProfileIF, obj: MongodbEntityIF): boolean {
    return this.profileOwnsObj(profile, obj); // proxy for now (might be replaced by a "canEdit" user-id array of users that can edit the given object)
  };

  userOwnsObj(user, obj): boolean { // if objects are populated (hydrated) use them, else use non-populated ids
    return this.ownerUserId(obj) == (user._id ? user._id : user).toString();
  }

  /**
  * Checks if the given user can edit a given model-instance
  */
  userCanEditObj(user, obj): boolean {
    return user.type == UserType.ADMIN || this.userOwnsObj(user, obj); // proxy for now (might be replaced by a "canEdit" user-id array of users that can edit the given object)
  };
}