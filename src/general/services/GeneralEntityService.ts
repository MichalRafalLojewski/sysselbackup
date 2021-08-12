import FileService from "../../entities/file/FileService";
import ProfileIF from "../../entities/profile/ProfileIF";
import LoggerIF from "../loggers/LoggerIF";
import GeneralModelService from "./GeneralModelService";

export default class GeneralEntityService {
    private logger: LoggerIF;
    private fileService: FileService;
    private generalModelService: GeneralModelService;
    constructor(fileService: FileService, generalModelService: GeneralModelService, logger: LoggerIF) {
        this.fileService = fileService;
        this.generalModelService = generalModelService;
        this.logger = logger;
    }
    /**
     * Validates a request-body for including pictures in a given entity
     * @param requestBody 
     * @param profile 
     */
    async validatePictureBody(requestBody, profile: ProfileIF) {
        const front_pic = requestBody.front_pic ? await this.fileService.fetchById(requestBody.front_pic) : null,
            other_pics = requestBody.other_pics ? await this.fileService.fetchByIds(requestBody.other_pics) : null;
        if (requestBody.front_pic && !front_pic) {
            this.logger.error("ItemService", "front_pic not found: " + requestBody.front_pic);
            throw { code: 404, message: "front_pic not found" };
        }
        if (requestBody.other_pics && requestBody.other_pics.length > 0 && ((!other_pics) || other_pics.length != requestBody.other_pics.length)) {
            this.logger.error("ItemService", "One or more of other_pics not found: [" + requestBody.other_pics + "]");
            throw { code: 404, message: "One or more of other_pics not found" };
        }

        let authFailedPics = [... (front_pic ? [front_pic] : []), ...(other_pics ? other_pics : [])]
            .filter(pic => !this.generalModelService.profileCanEditObj(profile, pic));
        if (authFailedPics.length > 0) {
            this.logger.security("ItemService", "Profile unathorized to use pics: " + authFailedPics.map(pic => pic._id.toString()));
            throw { code: 401, message: "Profile unathorized to use pics: " + authFailedPics.map(pic => pic._id.toString()) };
        }
    }

}
