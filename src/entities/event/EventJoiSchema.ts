/**
 * Joi schema for events
 * @param joi module
 */
export default class EventJoiSchema {
    public fetchWithParticipants;
    public fetchByCurrent;
    public fetchEventParticipantsByCurrent;
    constructor(joi) {

        this.fetchWithParticipants = {
            participants: joi.array().items(joi.string().min(1).max(1000)).unique().min(1).max(10000).required(),
            kind: joi.string().min(1).max(200),
            event_key: joi.string().min(1).max(200),
            belongs_to: joi.string().min(1).max(500).allow(null)
        };

        this.fetchByCurrent = {
            kind: joi.string().min(1).max(200),
            event_key: joi.string().min(1).max(200),
            belongs_to: joi.string().min(1).max(500).allow(null)
        };

        this.fetchEventParticipantsByCurrent = {
            ...this.fetchByCurrent,
            limit: joi.number().integer().min(1).max(100).required(),
            offset: joi.number().integer().required(),
            sort: joi.string().min(1).max(100).optional()
        };

    }
}