import FileIF from "./FileIF";
import ProfileIF from "../profile/ProfileIF";
import FileUploadServiceIF from "../../general/FileUploadServiceIF";
import Responses from "../../general/consts/Responses";
import GeneralModelService from "../../general/services/GeneralModelService";
import QueryService from "../../general/services/QueryService";
import to from 'await-to-js';
import { PicturedEntityIF } from "../MongodbEntityIF";
import LoggerIF from "../../general/loggers/LoggerIF";

export default class FileService {
    private fileUploadService: FileUploadServiceIF;
    private responses: Responses;
    private fileModel;
    private url_prefix: string;
    private generalModelService: GeneralModelService;
    private queryService: QueryService;
    public max_size_limit_bytes: number;
    private logger: LoggerIF;
    public static instance_sequence_number: number = 0; // used to give a unique intra-second value

    constructor(fileModel, fileUploadService: FileUploadServiceIF, generalModelService: GeneralModelService, queryService: QueryService, responses: Responses, url_prefix: string, max_size_limit_bytes: number, logger: LoggerIF) {
        this.fileUploadService = fileUploadService;
        this.responses = responses;
        this.fileModel = fileModel;
        this.generalModelService = generalModelService;
        this.queryService = queryService;
        this.url_prefix = url_prefix;
        this.max_size_limit_bytes = max_size_limit_bytes;
        this.logger = logger;
    }

    /**
     * Fetches a given file by id
     */
    async fetchById(id) {
        this.logger.info("FileService", "Fetching file by id: " + id);
        try {
            return await this.fileModel.findOne({ _id: id });
        } catch (exception) {
            this.logger.error("FileService", "Error fetching file with id: " + id, exception);
            throw exception.code ? exception : { code: 500, message: "Error fetching file with id: " + id, exception };
        }
    }

    /**
     * Fetches multiple files by ids
     */
    async fetchByIds(ids: any[], requestBody = {}) {
        this.logger.info("FileService", "Fetching files with ids: " + ids);
        try {
            return await this.queryService.orderByOffsetLimit(requestBody,
                this.queryService.filterNewerThan(requestBody,
                    this.queryService.filterOlderThan(requestBody,
                        this.fileModel.find({ _id: ids })
                    )));
        } catch (exception) {
            this.logger.error("FileService", "Error fetching files with ids: " + ids, exception);
            throw exception.code ? exception : { code: 500, message: "Exception while fetching files with ids: " + ids }
        }

    }

    /**
     * Uploads a given file to storage, and stores a corresponding file entry in db
     * @param req_file 
     * @param profile 
     */
    async upload(req_file, profile?: ProfileIF) {
        this.logger.info("FileService", "Uploading file (size: " + Math.ceil(req_file.size / 1000000) + " MB)");
        let err;
        if (req_file.size > this.max_size_limit_bytes) {
            this.logger.error("FileService", "File is too large");
            throw { code: 400, message: "File is larger than max limit of " + this.max_size_limit_bytes + " bytes" }
        }
        const file_key = this.generateNewFileKey(profile);
        this.logger.info("FileService", "File given file-key: " + file_key);
        [err] = await to(this.fileUploadService.upload(file_key, req_file));
        if (err) {
            this.logger.error("FileService", "Error while uploading file to bucket", err);
            throw err.code ? err : { code: 500, message: "Error while uploading file" }
        }
        let file: FileIF = new this.fileModel();
        file.size_bytes = req_file.size;
        file.file_key = file_key;
        file.public_url = this.url_prefix + "/" + file_key
        if (profile) {
            file.owner_profile = profile._id;
        }
        try {
            return await file.save();
        } catch (exception) {
            this.logger.error("FileService", "Error while saving file to db", exception);
            throw exception.code ? exception : { code: 500, message: "Error while saving file to db" }
        }
    }

    /**
     * Deletes a given file by id
     * @param file (db object)
     */
    async deleteById(profile: ProfileIF, file_id) {
        let err, file: FileIF;
        [err, file] = await to(this.fetchById(file_id));
        if (err) {
            this.logger.error("FileService", "Error while fetching file with id: " + file_id, err);
            throw err.code ? err : { code: 500, message: "Error while fetching file" }
        }
        if (!file) {
            this.logger.error("FileService", "File not found: " + file_id);
            throw { code: 404, message: "File not found" }
        }
        if (!this.generalModelService.profileCanEditObj(profile, file)) {
            this.logger.security("FileService", "Profile unauthorized to delete. File: " + file_id + ", Profile: " + profile._id);
            throw { code: 401, message: "Unauthorized" };
        }
        try {
            await Promise.all([this.fileUploadService.deleteByKey(file.file_key), this.fileModel.deleteOne({ _id: file._id })]);
            return "succes";
        } catch (exception) {
            this.logger.error("FileService", "Exception while deleting file", exception);
            throw exception.code ? exception : { code: 500, message: "Error while deleting file" };
        }
    }

    /**
     * Deletes a given file 
     * @param file (db object)
     */
    async delete(profile: ProfileIF, file: FileIF) {
        this.logger.info("FileService", "Deleting file: " + file._id);
        console.log(file);
        if (!this.generalModelService.profileCanEditObj(profile, file)) {
            this.logger.security("FileService", "Profile unauthorized to delete. File: " + file._id + ", Profile: " + profile._id);
            throw { code: 401, message: "Unauthorized" };
        }
        try {
            await Promise.all([this.fileUploadService.deleteByKey(file.file_key), this.fileModel.deleteOne({ _id: file._id })]);
            return "succes";
        } catch (exception) {
            this.logger.error("FileService", "Error while deleting file and db objects", exception);
            throw exception.code ? exception : { code: 500, message: "Error while deleting file" };
        }
    }

    /**
     * Deletes multiple files
     * @param file (db object)
     */
    async deleteMultiple(profile: ProfileIF, files: FileIF[]) {
        this.logger.info("FileService", "Deleting multiple files: [" + files.map(file => file._id) + "]");
        if (files.length < 1) {
            return { message: "Success" };
        }
        files.forEach(file => { // check file ownership
            if (!this.generalModelService.profileCanEditObj(profile, file)) {
                this.logger.security("FileService", "Profile unauthorized to access one or more file(s). File: " + file._id + ", Profile: " + profile._id);
                throw { code: 401, message: "One or more files not owned by profile" };
            }
        });
        try {
            await Promise.all([this.fileUploadService.deleteMultipleByKey(files.map(file => file.file_key)), this.fileModel.deleteMany({ _id: files.map(file => file._id) })]);
            return { message: "Success" };
        } catch (exception) {
            this.logger.error("FileService", "Exception while deleting files", exception);
            throw exception.code ? exception : { code: 500, message: "Error while deleting file" };
        }
    }

    // helper-methods:
    private generateNewFileKey(profile?: ProfileIF) {
        const randomString = (length: number, chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') => {
            var result = '';
            for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
            return result;
        }
        const timestamp_unix: number = Math.floor(Date.now() / 1000);
        return (profile?._id || "").toString() + "_" + timestamp_unix + "_" + (FileService.instance_sequence_number++) + "_" + randomString(7) + ".jpg";
    }

    /**
     * Takes an object before change, and the same object after change, and deletes orpahned/removed/outdated files associated with the object
     * (used at profile, item, mission and campaign update)
     * @param owner_profile 
     * @param object before change 
     * @param object after change
     * @return list of deleted files
     */
    async deleteOrpahnedFiles(owner_profile: ProfileIF, obj_old: PicturedEntityIF, obj_new: PicturedEntityIF) {
        this.logger.info("FileService", "Deleting orphaned files from: " + obj_old._id);
        let err, orphaned_file_ids: string[], files: FileIF[];
        [err, orphaned_file_ids] = await to(this.extractOrphanedPics(obj_old, obj_new));
        if (err) {
            this.logger.error("FileService", "Exception while extracting orphaned file-ids", err);
            throw err.code ? err : { code: 500, message: "Error while extracting orphaned file-ids" }
        }
        [err, files] = await to(this.fetchByIds(orphaned_file_ids));
        if (err) {
            this.logger.error("FileService", "Exception while fetching files to delete", err);
            throw err.code ? err : { code: 500, message: "Error while fetching files to delete" }
        }
        [err] = await to(this.deleteMultiple(owner_profile, files));
        if (err) {
            this.logger.error("FileService", "Exception while deleting", err);
            throw err.code ? err : { code: 500, message: "Error while deleting" }
        }
        return orphaned_file_ids;
    }

    /**
     * Takes in a model instance with pictures before and after an update, and detects orphaned pictures
     * @param obj_old 
     * @param obj_new 
     */
    async extractOrphanedPics(obj_old: PicturedEntityIF, obj_new: PicturedEntityIF): Promise<string[]> {
        this.logger.info("FileService", "Extracting orphaned pictures from: " + obj_old._id);
        const orphaned_pics: string[] = [];
        // front_pic:
        if ((obj_old.front_pic && (!obj_new.front_pic)) || (obj_old.front_pic && obj_new.front_pic) && obj_old.front_pic._id.toString() != obj_new.front_pic._id.toString()) {
            orphaned_pics.push(obj_old.front_pic._id.toString());
        }
        // other_pics:
        const old_files = obj_old.other_pics ? obj_old.other_pics.map(pic => pic._id.toString()) : [],
            new_files = obj_new.other_pics ? obj_new.other_pics.map(pic => pic._id.toString()) : [];
        return orphaned_pics.concat(old_files.filter(id => !new_files.includes(id)));
    }
}