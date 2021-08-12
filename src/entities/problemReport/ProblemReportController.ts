import ResponseService from "../../general/services/ResponseService";
import RequestOutIF from "../RequestOutIF";
import Responses from "../../general/consts/Responses";
import ProblemReportService from "./ProblemReportService";
import ProblemReportIF from "./ProblemReportIF";

/**
* Controller module for item-related requests.
*/
export default class ProblemReportController {
  private problemReportService: ProblemReportService;
  private responseService: ResponseService;
  private responses: Responses;

  constructor(problemReportService: ProblemReportService, responseService: ResponseService, responses: Responses) {
    this.problemReportService = problemReportService;
    this.responseService = responseService;
    this.responses = responses;
  }

  /**
* Creates a problem report
*/
  create(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (problemReport: ProblemReportIF) => me.responseService.respond(res, 200, problemReport);
    me.problemReportService.create(req.body, req.profile).then(ok).catch(anyErr);
  };

  /**
  * Fetches a given problem-report by id
  */
  fetchById(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (problemReport: ProblemReportIF) => me.responseService.respond(res, 200, problemReport);
    me.problemReportService.fetchById(req.params.id, req.query).then(function (problemReport: ProblemReportIF) {
      if (!problemReport) {
        return anyErr({ code: 404, message: "Not found" });
      }
      ok(problemReport);
    }).catch(anyErr);
  };

  /**
  * Fetches all
  */
  fetchMultiple(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = (problemReports: ProblemReportIF[]) => this.responseService.respond(res, 200, problemReports);
    this.problemReportService.fetchMultiple(req.query).then(ok).catch(anyErr);
  };

  /**
  * Deletes a given problem-report by id
  */
  deleteById(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = () => this.responseService.respond(res, 200, { message: this.responses.success });
    this.problemReportService.deleteById(req.params.id).then(ok).catch(anyErr);
  }

};
