import CheckerIF from "../CheckerIF";
import ProfileIF from "../profile/ProfileIF";
import { TransactionIF } from "./TransactionIF";

export default class TransactionChecker implements CheckerIF {
    /**
     * Checks if given profile is sender of transaction
     */
    is_sender(profile: ProfileIF, transaction: TransactionIF): boolean {
        return transaction.sender._id.toString() == profile._id.toString();
    }

    /**
    * Checks if given profile is receiver of transaction
    */
    is_receiver(profile: ProfileIF, transaction: TransactionIF): boolean {
        return transaction.sender._id.toString() == profile._id.toString();
    }

    async belongsToAccepted(transaction: TransactionIF, current_profile: ProfileIF, target_profile: ProfileIF): Promise<boolean> {
        try {
            const [current_can_access, target_profile_can_access] = await Promise.all([
                this.canAccess(transaction, current_profile),
                this.canAccess(transaction, target_profile)]);
            if (!(current_can_access && target_profile_can_access)) {
                return false;
            }
            return true;
        } catch (exception) {
            throw exception.code ? exception : { code: 500, message: "Error while checking belongs_to accepted" }
        }
    }

    async canAccess(transaction: TransactionIF, profile1: ProfileIF): Promise<boolean> {
        return this.is_receiver(profile1, transaction) || this.is_sender(profile1, transaction);
    }
}