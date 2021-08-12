import TransactionService from "./TransactionService";
import ResponseService from "../../general/services/ResponseService";
import Responses from "../../general/consts/Responses";
import {TransactionIF} from "./TransactionIF";
import RequestOutIF from "../RequestOutIF";

export default class TransactionController {

  private transactionService: TransactionService;
  private responseService: ResponseService;
  private responses: Responses;

  constructor(transactionService: TransactionService, responseService: ResponseService, responses: Responses) {
    this.transactionService = transactionService;
    this.responses = responses;
    this.responseService = responseService;
  }

  /**
   * Fetches a given transaction by id
   */
  fetchById(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (transaction: TransactionIF) => this.responseService.respond(res, 200, transaction);
    this.transactionService.fetchById(req.profile, req.params.id).then(function (transaction: TransactionIF) {
      if (!transaction) // check found
      {
        return anyErr({ code: 404, message: "Not found" });
      }

      ok(transaction);
    }).catch(anyErr);
  };

  /**
  * Fetches multiple orders the current user participates in (current profile is either seller or buyer)
  */
  fetchMultiple(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (transactions: TransactionIF[]) => this.responseService.respond(res, 200, transactions);
    this.transactionService.fetchMultiple(req.query, req.profile).then(ok).catch(anyErr);
  };
}