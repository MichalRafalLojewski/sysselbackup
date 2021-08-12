interface UploadIF{
  file;
}

/**
 * Joi schema for messages
 * @param joi module
 */
export default class FileJoiSchema {
  public upload: UploadIF;
  constructor(joi) {


    this.upload = {
      file: joi.any().required()
    }

  }
}