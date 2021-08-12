import LoggerIF from "../loggers/LoggerIF";

export default class ResponseService{
private logger: LoggerIF;
  constructor(logger: LoggerIF){
    this.logger = logger;
  }
  respond(res,code,payload)
  {
    this.logger.info("ResponseService", "Response: "+code+ (code == 200 ? " OK": "")+", Payload length: "+JSON.stringify(payload).length +" chars");
    res.status(code).json(payload);
  };
}