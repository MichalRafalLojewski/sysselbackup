import ResponseService from "../../general/services/ResponseService";
import Responses from "../../general/consts/Responses";
import RequestOutIF from "../RequestOutIF";
import FileService from "./FileService";
import FileIF from "./FileIF";
import LoggerIF from "../../general/loggers/LoggerIF";

export default class FileController {


  private responseService: ResponseService;
  private responses: Responses;
  private fileService: FileService;
  private uploadMiddleware;
  private logger: LoggerIF;

  constructor(fileService: FileService, responseService: ResponseService, responses: Responses, uploadMiddleware, logger: LoggerIF) {
    this.responses = responses;
    this.responseService = responseService;
    this.fileService = fileService;
    this.uploadMiddleware = uploadMiddleware;
    this.logger = logger;
  }

  /**
   * Uploads a new file using multer middleware
   * @param req 
   * @param res 
   */
  upload(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (file: FileIF) => me.responseService.respond(res, 200, file);
    me.uploadMiddleware(req, res, function (err) {
      if (req.wrongFileType) {
        return anyErr({ code: 400, message: "Wrong file type. Only image/jpeg allowed" });
      }
      if (err) {
        return anyErr({ code: 400, message: "File is too big" })
      }
      me.fileService.upload(req.file, req.profile).then(ok).catch(anyErr);
    });
  }

  /**
   * Fetches a given file by id
   */
  fetchById(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (file: FileIF) => me.responseService.respond(res, 200, file);
    this.fileService.fetchById(req.query.id).then(ok).catch(anyErr);
  };

  /**
   * Fetches a given file by id
   */
  fetchByIds(req, res) {
    const me = this,
      anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
      ok = (file: FileIF) => me.responseService.respond(res, 200, file);
    this.fileService.fetchByIds(req.query.ids).then(ok).catch(anyErr);
  };

  /**
   * Deletes a given file by id
   */
  async deleteById(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = () => this.responseService.respond(res, 200, { message: this.responses.success });
    const file = await this.fileService.fetchById(req.params.id);
    if (!file) {
      return anyErr({ code: 404, message: "Not found" });
    }
    this.fileService.delete(req.profile, file).then(ok).catch(anyErr);
  };

  /**
   * Deletes multiple files by id
   */
  async deleteByIds(req, res) {
    const anyErr = (response: RequestOutIF) => this.responseService.respond(res, response.code, { message: response.message }),
      ok = () => this.responseService.respond(res, 200, { message: this.responses.success });
    const files: FileIF[] = await this.fileService.fetchByIds(req.query.ids);
    if (files.length < req.query.ids) {
      return anyErr({ code: 404, message: "Not found" });
    }
    this.fileService.deleteMultiple(req.profile, files).then(ok).catch(anyErr);
  };
}