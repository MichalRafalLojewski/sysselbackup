import GeneralJoiSchema from "../../general/JoiSchemas/GeneralJoiSchema";

interface SendIF{
  receiver;
  text;
  belongs_to_order;
}

interface SenderIF{
  sender;
}

/**
 * Joi schema for messages
 * @param joi module
 */
export default class MessageJoiSchema {
  public send: SendIF;
  public sender: SenderIF;

  constructor(joi, generalSchema: GeneralJoiSchema) {

    this.send = {
      receiver: joi.string().min(1).max(200).required(),
      text: joi.string().min(1).max(50000).required(),
      ...generalSchema.belongsTo
    };

    this.sender = {
      sender: joi.string().min(1).max(1000)
    }

  }
}