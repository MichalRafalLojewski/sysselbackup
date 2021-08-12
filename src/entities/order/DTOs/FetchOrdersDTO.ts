import OrderIF from "../OrderIF";

export interface FetchAllOrdersOutDTO {
    metaData: {
        totalCount: number
    },
    data: OrderIF[]
}