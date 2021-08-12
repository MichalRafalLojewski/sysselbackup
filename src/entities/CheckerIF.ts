import ProfileIF from "./profile/ProfileIF";

export default interface CheckerIF {
    /**
     * Checks if the given profiles can access the given entity
     * @param entity 
     * @param profile1 
     * @param profile2 
     */
    belongsToAccepted(entity: any, profile1: ProfileIF, profile2?: ProfileIF): Promise<boolean>

    /**
     * Checks if the given profiles can access the given entity
     * @param entity 
     * @param profile1 
     * @param profile2 
     */
    canAccess(entity: any, profile1: ProfileIF): Promise<boolean>
}