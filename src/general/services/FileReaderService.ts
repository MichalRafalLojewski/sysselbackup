import LoggerIF from "../loggers/LoggerIF";

export default class FileReaderService {
    private fileSystem;
    private logger: LoggerIF;
    constructor(fileSystem, logger: LoggerIF) {
        this.fileSystem = fileSystem;
        this.logger = logger;
    }

    async readFile(filePath: string) {
        const me = this;
        return new Promise(function (resolve, reject) {
            me.fileSystem.readFile(filePath, 'utf8', function (err, data) {
                if (err) {
                    me.logger.error("FileReaderService","Exception while reading file: "+filePath, err);
                    return reject(err.code ? err : { code: 500, message: "Error while reading file" });
                }
                resolve(data);
            });
        })
    }
}