import EventService from "../../entities/event/EventService";

/**
 * Module for holding joi validation schema objects (used for data validation in routes)
 * @joi module
 * @schemaParts : An array of joi-schema objects to combine into parent
 */
export default class GeneralJoiSchema {
  public orderByFilterLimit;
  public fetchById;
  public fetchByProfile;
  public active;
  public populateFields;
  public owner;
  public search;
  public category;
  public hasCategory;
  public newerThan;
  public olderThan;
  public picture;
  public sender;
  public receiver;
  public lastSignatureOnly;
  public gpsLocation;
  public listed;
  public filterByLocation;
  public type;
  public multipleIds;
  public belongsTo;
  public filterByOwner;
  constructor(joi) {
    /**
     * create validation schemas:  (nested in objects by model-type for better organization)
     * (decomposed to small chunks for better re-use)
     */
    // required params:
    this.orderByFilterLimit = {
      limit: joi.number().integer().min(1).max(100).required(),
      offset: joi.number().integer().required(),
      sort: joi.string().min(1).max(100).required(),
    };

    this.filterByLocation = {
      lat: joi.number(),
      long: joi.number(),
      max_distance: joi.number().integer().min(0),
    };
    this.filterByOwner = {
      owner_user: joi.string().min(1).max(1000),
      owner_profile: joi.string().min(1).max(1000),
    };
    this.multipleIds = {
      ids: joi
        .array()
        .items(joi.string().min(1).max(500))
        .min(1)
        .max(1000)
        .required(),
    };
    this.fetchById = {
      id: joi.string().min(1).max(1000).required(),
    };

    this.fetchByProfile = {
      owner_profile: joi.string().min(1).max(1000).required(),
    };

    // optional params:
    this.active = {
      active: joi.boolean(),
    };
    this.listed = {
      listed: joi.boolean(),
    };
    this.populateFields = {
      populate: joi.array().items(joi.string().min(1).max(200)).min(1).max(100),
    };

    this.type = {
      type: joi.string().min(1).max(100),
    };

    this.lastSignatureOnly = {
      last_signature_only: joi.boolean(),
    };

    this.gpsLocation = joi.object().keys({
      type: joi.string().valid(["Point"]).required(),
      coordinates: joi.array().items(joi.number()).min(2).max(2).required(),
    });

    this.owner = {
      owner: joi.string().min(1).max(1000),
    };

    this.search = {
      search: joi.string().min(1).max(5000),
    };

    this.category = {
      category: joi.string().min(1).max(1000),
    };

    this.hasCategory = {
      hasCategory: joi.string().min(1).max(1000),
    };

    this.newerThan = {
      newer_than: joi.string().min(1).max(1000),
    };

    this.olderThan = {
      older_than: joi.string().min(1).max(1000),
    };

    this.picture = joi.string().min(1).max(500);

    this.sender = {
      sender: joi.string().min(1).max(1000),
    };

    this.receiver = {
      receiver: joi.string().min(1).max(1000),
    };

    this.belongsTo = {
      belongs_to: joi.string().min(1).max(200),
      belongs_to_kind: joi.string().valid(EventService.validBelongsToTypes()),
    };
  }
}
