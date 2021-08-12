import ItemIF from "../ItemIF";

export interface FetchAllItemsOutDTO {
    metaData: {
        totalCount: number
    },
    data: ItemIF[]
}