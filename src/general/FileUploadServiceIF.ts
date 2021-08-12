export default interface FileUploadServiceIF{
    /**
     * Uploads a given file with a give file-key as identifier
     * @param file_key 
     * @param file 
     */
    upload(file_key: string, file);
    
    /**
     * Deletes a given file by file-key (identifier)
     * @param file_key 
     */
    deleteByKey(file_key: any);

    /**
     * Deletes multiple given files by keys
     * @param file_key 
     */
    deleteMultipleByKey(file_keys: any[]);
}