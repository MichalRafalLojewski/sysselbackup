import ProfileIF from "../profile/ProfileIF";

export default class ProfileSubscriptionChecker {

    private subscriptionModel;
    constructor(subscriptionModel) {
        this.subscriptionModel = subscriptionModel;
    }
    /**
     * Checks if the profile subscribes to another given profile
     */
    profileDoesSubscribe(profile, subscribes_to): Promise<boolean> {
        const me = this;
        return new Promise(function (resolve, reject) {
            me.subscriptionModel.findOne({ profile: profile._id, subscribe_to: subscribes_to._id }).then(function (obj) {
                if (obj) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            }).catch(reject);
        });
    }

    /**
     * Checks if the profiles have same owner
     * @param profile1 
     * @param profile2 
     */
    profilesSameOwner(profile1: ProfileIF, profile2: ProfileIF){
        return profile1.owner._id ? (profile1.owner._id.toString() == profile2.owner._id.toString()) : (profile1.owner.toString() == profile2.owner.toString());
    }
}