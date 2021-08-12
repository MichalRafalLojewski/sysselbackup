export default interface LoggerIF{
    /**
     * Logs an info message
     * @param originModule 
     * @param message 
     */
    info(originModule: string, message: string, exception?);

    /**
     * Logs an error message
     * @param originModule 
     * @param message 
     */
    error(originModule: string, message: string,  exception?);

    /**
     * Logs an important system message to the log
     * used to force log entry
     * @param originModule 
     * @param message 
     */
    important(originModule: string, message: string, exception?);

    /**
     * Logs messages related to security, such as unauthorized access etc...
     * @param originModule 
     * @param message 
     */
    security(originModule: string, message: string, exception?);
}