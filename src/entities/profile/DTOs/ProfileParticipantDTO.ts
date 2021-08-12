import ProfileIF from "../ProfileIF";

/**
 * A wrapper for profile participants to fetch participants and last event
 */
export interface ProfileParticipantWrappedDTO{
    last_event: Date | undefined;
    profile: ProfileIF | undefined;
}