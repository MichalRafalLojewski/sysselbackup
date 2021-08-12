import ProfileIF from "../../profile/ProfileIF";
import { UserIF } from "../UserIF";

export interface RegisterBothOutDTO{
    user: UserIF;
    profile: ProfileIF;
    token: string;
}