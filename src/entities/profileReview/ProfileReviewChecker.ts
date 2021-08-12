import ProfileIF from "../profile/ProfileIF";

/**
 * Service for performing boolean checks for posting, fetching or updating reviews
 */
export default class ProfileReviewChecker {
    /**
     * Checks that the two objects are set
     */
    preCondition(o1, o2): boolean {
        return (o1 && o2);
    }

    /**
     * Checks if a given profile can review the given item
     * NOTE: Returns a promise so that long tasks (such as db-calls) can be done async
     */
    async canReviewProfile(profile: ProfileIF, target_profile: ProfileIF): Promise<boolean> {
        return this.preCondition(profile, target_profile)
                && target_profile.active == true
                && (profile.owner._id.toString() != target_profile.owner._id.toString())
    }
}