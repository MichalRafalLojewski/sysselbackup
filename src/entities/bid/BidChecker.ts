import ProfileIF from "../profile/ProfileIF";
import MissionIF from "../mission/MissionIF";
import ProfileService from "../profile/ProfileService";
import {BidIF, BidStatus} from "./BidIF";

export default class BidChecker {
    private profileService: ProfileService;
    constructor(profileService: ProfileService) {
        this.profileService = profileService;
    }
    async canBid(profile: ProfileIF, mission: MissionIF): Promise<boolean> {
        try{
            const mission_owner: ProfileIF = await this.profileService.fetchById(mission.owner_profile._id);
            return profile.owner._id.toString() != mission_owner.owner._id.toString(); // check owner users not the same between the two profiles
        }catch(exception){
            throw exception.code ? exception : {code: 500, message: "Error while fetching mission owner profile during check"};
        }
    }

    /**
     * Checks if the given bid status can be changed (rejected or accepted) for the given mission
     * @param bid 
     * @param mission 
     */
    async canChange(bid: BidIF, mission: MissionIF): Promise<boolean>{
        return (bid.status == BidStatus.PENDING) && mission.active;
    }
}