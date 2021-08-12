import ProfileIF from "../ProfileIF";

export interface FetchAllProfilesOutDTO {
    metaData: {
        totalCount: number
    },
    data: ProfileIF[]
}