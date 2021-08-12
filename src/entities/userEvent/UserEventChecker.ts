import { EventIF } from "../event/EventIF";
import { UserIF } from "../user/UserIF";

/**
 * Contains event-related check functions such as auth or validity checking
 */
export default class UserEventChecker{
    canAccess(user: UserIF, event: EventIF): boolean{
        return event.participants.map(participant => participant._id.toString()).includes(user._id.toString());
    }
}