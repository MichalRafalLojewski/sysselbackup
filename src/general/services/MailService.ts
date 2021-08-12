import LoggerIF from "../loggers/LoggerIF";
/**
 * Interface to configure mail-server-connection auth
 */
export interface MailAuthIF {
    user: string;
    pass: string;
}
/**
 * Interface to configure mail-server-connection
 */
export interface MailConfigIF {
    host: string;
    port: number;
    secure: boolean;
    auth: MailAuthIF;
}

/**
 * Service for handling sending of email
 */
export class MailService {
    private transporter;
    private logger: LoggerIF;
    private mailConf: MailConfigIF;
    constructor(mailConf: MailConfigIF, nodeMailer, logger: LoggerIF) {
        this.logger = logger;
        this.mailConf = mailConf;
        try {
            this.transporter = nodeMailer.createTransport(mailConf);
        } catch (exception) {
            this.logger.error("MailService", "Exception creating node-mail transorpert", exception);
            throw exception;
        }
    }

    async sendMail(to_email: string, subject: string, body: string) {
        this.logger.info("MailService", "Sending mail to: " + to_email + ". Body-size: " + body.length);
        try {
            const mail_res = await this.transporter.sendMail({
                from: '"Syssel" <' + this.mailConf.auth.user + '>', // sender address
                to: to_email,
                subject: subject,
                text: body
            });
            this.logger.info("MailService", "Mail sent to: " + to_email);
        } catch (exception) {
            this.logger.error("MailService", "Exception sending email to: " + to_email + ". Body-length: " + body.length, exception);
            throw exception;
        }

    }
}