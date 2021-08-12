import FileReaderService from "../services/FileReaderService";
import ResponseService from "../services/ResponseService";
import LoggerIF from "../loggers/LoggerIF";

export default class LogController {

    private fileReaderService: FileReaderService;
    private logPath: string;
    private responseService: ResponseService;
    private logger: LoggerIF;

    /**
     * 
     * @param fileReaderService 
     * @param logPath  (path to log-file accessible trough the /logs endpoint. IMPORTANT: ONLY MEANT IN DEVELOPMENT MODE)
     */
    constructor(fileReaderService: FileReaderService, responseService: ResponseService, logger: LoggerIF, logPath: string) {
        this.fileReaderService = fileReaderService;
        this.logPath = logPath;
        this.responseService = responseService;
        this.logger = logger;
    }

    /**
     * Reads and returns the log-file
     * @param req 
     * @param res 
     */
    async getLogs(req, res) {
        try {
            res.setHeader('content-type', 'text/plain');
            res.send(await this.fileReaderService.readFile(this.logPath));
        } catch (exception) {
            this.logger.error("LogController", "Exception while reading log at: " + this.logPath, exception);
            this.responseService.respond(res, 500, { message: "Failed to read log file at: " + this.logPath });
        }
    }
}