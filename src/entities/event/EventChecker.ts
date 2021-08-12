import ProfileIF from "../profile/ProfileIF";
import { EventIF } from "./EventIF";

/**
 * Contains event-related check functions such as auth or validity checking
 */
export default class EventChecker{
    canAccess(profile: ProfileIF, event: EventIF): boolean{
        return event.participants.map(participant => participant._id.toString()).includes(profile._id.toString());
    }
}