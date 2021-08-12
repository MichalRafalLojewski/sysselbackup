import ItemOptionsIF from "../itemOptions/ItemOptionsIF";
import PaymentOptionIF from "../profile/PaymentOptionIF";
import { Currency } from "./Currency";
import { PaymentOption } from "./PaymentOption";

/**
 * Default item-options value in case item does not have item-options
 */
export const DefaultItemOptions: ItemOptionsIF = {
    title: "Default Options",
    accepted_payment_options: [PaymentOption.BANK_WIRE, PaymentOption.VISA],
    require_accept: false,
    use_escrow: false,
    base_currency: Currency.NOK
}

export const DefaultPaymentOption: PaymentOptionIF = { // keep for legacy
    option_label: "Bank",
    data: {
        bank_name: "DNB",
        account_number: "1503.92.67702",
    }
}