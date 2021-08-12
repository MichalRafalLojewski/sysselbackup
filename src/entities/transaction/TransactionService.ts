import QueryService from "../../general/services/QueryService";
import ProfileIF from "../profile/ProfileIF";
import OrderIF from "../order/OrderIF";
import { TransactionIF } from "./TransactionIF";
import TransactionChecker from "./TransactionChecker";
import TransactionModel from "./Transaction";
import LoggerIF from "../../general/loggers/LoggerIF";

/**
* Order-related functionality shared by multiple controllers
*/
export default class TransactionService {

  private transactionModel;
  private queryService: QueryService;
  private transactionChecker: TransactionChecker;
  private logger: LoggerIF;
  constructor(transactionModel, queryService: QueryService, transactionChecker: TransactionChecker, logger: LoggerIF) {
    this.transactionModel = transactionModel;
    this.queryService = queryService;
    this.transactionChecker = transactionChecker;
    this.logger = logger;
  }

  /**
 * Checks if the given object is a transaction
 */
  isTransaction = function (obj): boolean {
    return obj instanceof this.transactionModel;
  }

  /**
   * Creates and stores a new transaction record to db
   */
  async create(sender: ProfileIF, receiver: ProfileIF, amount: number, base_currency: string, description?: string, order?: OrderIF, external_payment_ids?: any[], payin_data?, payout_data?): Promise<TransactionIF> {
    this.logger.info("TransactionService", "Creating new transaction. sender: " + sender._id + ", receiver: " + receiver._id + ", amount: " + amount + ", base_currency: " + base_currency + ", order: " + order._id + ", external_payment_ids: [" + (external_payment_ids ? external_payment_ids : "") + "]");
    const transaction: TransactionIF = {
      sender: sender._id,
      receiver: receiver._id,
      participants: [sender._id, receiver._id],
      order: order ? order._id : null,
      amount: amount,
      base_currency: base_currency,
      description: description ? description : null,
      external_payin_data: payin_data ? payin_data : null,
      external_payout_data: payout_data ? payout_data : null,
      external_payment_ids: external_payment_ids ? external_payment_ids : []
    };
    try {
      return await new this.transactionModel(transaction).save();
    } catch (exception) {
      this.logger.error("TransactionService", "Eexception saving transaction to db", exception);
      throw exception.code ? exception : { code: 500, message: "Error while saving transaction to db" }
    }
  };

  /**
  * Fetches a given transaction by id
  */
  async fetchById(profile: ProfileIF, id) {
    this.logger.info("TransactionService", "Fetching transaction by id: " + id + ", profile: " + profile._id);
    try {
      const transaction: TransactionIF = await this.transactionModel.findOne({ _id: id });
      if (!(this.transactionChecker.is_sender(profile, transaction) || this.transactionChecker.is_receiver(profile, transaction))) // chdck access
      {
        this.logger.security("TransactionService", "Unauthorized to fetch transaction (given profile is not seller nor receiver)");
        throw { code: 401, message: "Unauthorized" }
      }
      return transaction;
    } catch (exception) {
      this.logger.error("TransactionService", "Exception fetching", exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching" };
    }
  };

  /**
   * Fetches a transaction that contain the given external-payment id in its array of external payment ids attched to the transaction
   * @param id 
   */
  async fetchByExternalPaymentId(id): Promise<TransactionIF> {
    this.logger.info("TransactionService", "Fetching transaction by external payment id: " + id);
    try {
      return await this.transactionModel.findOne({ external_payment_ids: id }) // find all conversations where current user is a participant
    } catch (exception) {
      this.logger.error("TransactionService", "Exception fetching", exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching transactions by external-payment-id (used when transaction is tied to external payment-processor transaction by id)" }
    }
  }

  /**
   * Fetches multiple transactions where current profile is involved (current profile is sender or receiver)
   */
  async fetchMultiple(requestBody, current_profile: ProfileIF) {
    this.logger.info("TransactionService", "Fetching transactions current user participates in. current_profile: " + current_profile._id);
    try {
      return await this.queryService.orderByOffsetLimit(requestBody,
        this.queryService.filterSender(requestBody,
          this.queryService.filterReceiver(requestBody,
            this.queryService.filterOlderThan(requestBody,
              this.queryService.filterNewerThan(requestBody,
                this.queryService.populateFields(TransactionModel.populateable(), requestBody,
                  this.transactionModel.find({participants: current_profile._id}) // current user must be buyer or seller
                ))))));
    } catch (exception) {
      this.logger.error("TransactionService", "Exception fetching", exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching" };
    }
  };
}
