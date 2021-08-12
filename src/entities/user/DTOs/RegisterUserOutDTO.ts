import { UserIF } from "../UserIF";

export interface RegisterUserOutDTO {
    user: UserIF;
    token: string;
}