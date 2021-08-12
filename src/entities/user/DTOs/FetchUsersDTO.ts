import { UserIF } from "../UserIF";

export interface FetchAllUsersOutDTO {
    metaData: {
        totalCount: number
    },
    data: UserIF[]
}