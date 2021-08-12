import QueryService from "../../general/services/QueryService";
import ItemOptionsIF from "./ProblemReportIF";
import ProfileIF, { ProfileType } from "../profile/ProfileIF";
import Responses from "../../general/consts/Responses";
import to from 'await-to-js';
import LoggerIF from "../../general/loggers/LoggerIF";
import ProblemReportIF from "./ProblemReportIF";
import ProblemReportModel from "./ProblemReport";

/**
 * service for itemOptions-related functionality
 */
export default class ProblemReportService {
  private queryService: QueryService;
  private problemReportModel;
  private responses: Responses;
  private logger: LoggerIF;

  constructor(queryService: QueryService, problemReportModel, responses: Responses, logger: LoggerIF) {
    this.queryService = queryService;
    this.problemReportModel = problemReportModel;
    this.responses = responses;
    this.logger = logger;
  }

  /**
   * Creates a new problem report
   */
  async create(requestBody: ProblemReportIF, current_profile: ProfileIF): Promise<ItemOptionsIF> {
    let err, problemReportSaved: ProblemReportIF;
    this.logger.info("ProblemReportService", "Creating problemReport. Profile: " + current_profile._id);
    const problemReport = new this.problemReportModel(requestBody);
    problemReport.owner_profile = current_profile._id;
    [err, problemReportSaved] = await to(problemReport.save());
    if (err) {
      this.logger.error("ProblemReportService", "Exception saving problemReport", err);
      throw err.code ? err : { code: 500, message: "Error while saving ItemOptions" }
    }
    return problemReportSaved;
  };

  /**
  * Fetches a given problem-report by id
  */
  async fetchById(id, requestBody: any = {}) {
    this.logger.info("ProblemReportService", "Fetching problemReport by id: " + id);
    try {
      return await this.queryService.populateFields(ProblemReportModel.populateable(), requestBody,
        this.problemReportModel.findOne({ _id: id }));
    } catch (exception) {
      this.logger.error("ProblemReportService", "Exception while fetching problemReport by id", exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching" };
    }
  }

  /**a
  * Filters after
* @param Query-builder to perform on
* @param Request
*/
  filterAfter(req, query) {
    if (req.after) {
      const date = new Date(req.after);
      return query.find({ date: { $gt: date } });
    }
    return query;
  }

  /**
  * Filters before
  * @param Query-builder to perform on
  * @param Request
  */
  filterBefore(req, query) {
    if (req.before) {
      const date = new Date(req.before);
      return query.find({ created_at: { $lt: date } });
    }
    return query;
  }

  /**
  * Fetches all problem-reports that match given search criteria
  */
  async fetchMultiple(requestBody): Promise<ProblemReportIF[]> {
    this.logger.info("ProblemReportService", "Fetching any");
    try {
      return this.queryService.orderByOffsetLimit(requestBody,
        this.queryService.filterSearch('title', requestBody,
          this.queryService.filterNewerThan(requestBody,
            this.queryService.filterOlderThan(requestBody,
                this.filterBefore(requestBody,
                  this.filterAfter(requestBody,
                    this.queryService.populateFields(ProblemReportModel.populateable(), requestBody,
                      this.problemReportModel.find({})
                    )))))));
    } catch (exception) {
      this.logger.error("ProblemReportService", "Exception fetching any", exception);
      throw exception.code ? exception : { code: 500, message: "Error while fetching" }
    }
  };


  /**
  * Deletes a given problem-report by id
  */
  async deleteById(problemReportId): Promise<boolean> {
    this.logger.info("ProblemReportService", "Deleting by id: " + problemReportId);
    let err, problemReport: ProblemReportIF;
    [err, problemReport] = await to(this.fetchById(problemReportId));
    if (!problemReport) {
      this.logger.error("ProblemReportService", "problem-report not found");
      throw { code: 404, message: "Problem-report not found" }
    }
    [err] = await to(this.problemReportModel.deleteOne({ _id: problemReport._id }));
    if (err) {
      this.logger.error("ProblemReportService", "Exception while deleting problem-report", err);
      throw err.code ? err : { code: 500, message: "Error while deleting problem-report from db" }
    }
    return true;
  }
}