import ProfileIF from "../profile/ProfileIF";
import ItemIF from "../item/ItemIF";

/**
 * Service for performing boolean checks for posting, fetching or updating reviews
 */
export default class ItemReviewChecker {

    /**
     * Checks that the two objects are set
     */
    preCondition(o1, o2) {
        return (o1 && o2);
    }

    /**
     * Checks if a given profile can review the given item
     * NOTE: Returns a promise so that long tasks (such as db-calls) can be done async
     */
    async canReviewItem(profile: ProfileIF, item: ItemIF): Promise<boolean> {
        return this.preCondition(profile, item)
            && item.active == true
            && (profile.owner._id.toString() != item.owner_profile.owner._id.toString());
    }
}