import CheckerIF from "../CheckerIF";
import ProfileIF from "../profile/ProfileIF";
import MissionIF from "./MissionIF";

export default class MissionChecker implements CheckerIF {

    async belongsToAccepted(mission: MissionIF, current_profile: ProfileIF, target_profile: ProfileIF): Promise<boolean> {
        try {
            const [current_can_access, target_profile_can_access] = await Promise.all([
                this.canAccess(mission, current_profile),
                this.canAccess(mission, target_profile)]);
            if (!(current_can_access && target_profile_can_access)) {
                return false;
            }
            return true;
        }catch(exception){
            throw exception.code ? exception : {code: 500, message: "Error while checking belongs_to accepted"}
        }
    }

    async canAccess(mission: MissionIF, profile1: ProfileIF): Promise<boolean> {
        return mission.active; // missions are accessible to everyone
    }

}