import LoggerIF from "./LoggerIF";

/**
 * Logger implementation that logs directly to console
 */
export default class ConsoleLogger implements LoggerIF {

    private include_types: string[];
    constructor(include_types: string[] = ["INFO", "SECURITY", "ERROR", "IMPORTANT"]) {
        this.include_types = include_types;
    }

    security(originModule: string, message: string, trace?: any) {
        this.log("SECURITY", originModule, message, trace);
    }

    /**
    * Logs an info message
    * @param originModule 
    * @param message 
    */
    info(originModule: string, message: string, trace?) {
        this.log("INFO", originModule, message, trace);
    }

    /**
     * Logs an error message
     * @param originModule 
     * @param message 
     */
    error(originModule: string, message: string, trace?) {
        this.log("ERROR", originModule, message, trace);
    }


    /**
     * Logs an important system message to the log
     * used to force log entry
     * @param originModule 
     * @param message 
     */
    important(originModule: string, message: string, trace?) {
        this.log("IMPORTANT", originModule, message, trace);
    }

    private log(type: string, originModule: string, message: string, trace?) {
        if (this.include_types.includes(type)) {
            console.log("[" + type + "] [" + originModule + "] - " + this.formatDate(new Date()) + " : " + message);
            if (trace){
                console.log("TRACE:::");
                console.log(trace);
            }
        }
    }

    private formatDate(date) {
        const parts: any[] = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
            .toISOString()
            .split("T");
        return "[" + parts[0] + "  " + parts[1] + "]";
    }
}