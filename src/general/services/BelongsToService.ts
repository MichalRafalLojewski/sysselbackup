import OrderChecker from "../../entities/order/OrderChecker";
import MissionChecker from "../../entities/mission/MissionChecker";
import to from 'await-to-js';
import CheckerIF from "../../entities/CheckerIF";
import { MongodbEntityIF } from "../../entities/MongodbEntityIF";
import EventService from "../../entities/event/EventService";
import TransactionChecker from "../../entities/transaction/TransactionChecker";

export default class BelongToService {
    private orderModel;
    private missionModel;
    private orderChecker: OrderChecker;
    private missionChecker: MissionChecker;
    private transactionChecker: TransactionChecker;
    private profileModel;
    private transactionModel;
    constructor(
        orderChecker: OrderChecker,
        missionChecker: MissionChecker,
        transactionChecker: TransactionChecker,
        profileModel,
        missionModel,
        orderModel,
        transactionModel
    ) {
        this.orderModel = orderModel;
        this.missionModel = missionModel;
        this.orderChecker = orderChecker;
        this.missionChecker = missionChecker;
        this.profileModel = profileModel;
        this.transactionModel = transactionModel;
        this.transactionChecker = transactionChecker;
    }

    private async fetchModelCheckerPair(kind: string) {
        if (!EventService.validBelongsToTypes().includes(kind)) {
            throw { code: 400, message: "Invalid belongs_to kind. Allowed: " + EventService.validBelongsToTypes() }
        }
        let model;
        let checker;
        switch (kind) {
            case "Order":
                model = this.orderModel;
                checker = this.orderChecker;
                break;
            case "Mission":
                model = this.missionModel;
                checker = this.missionChecker;
                break;
            case "Transaction":
                model = this.transactionModel;
                checker = this.transactionChecker;
                break;
        }
        if (!(model && checker)) {
            throw { code: 500, message: "Service and checker for " + kind + " not found" }
        }
        return {
            model: model,
            checker: checker
        }
    }

    async fetchBelongsTo(entity_id, kind: string): Promise<MongodbEntityIF> {
        if (!EventService.validBelongsToTypes().includes(kind)) {
            throw { code: 400, message: "Invalid belongs_to kind. Allowed: " + EventService.validBelongsToTypes() }
        }
        try {
            return await (await this.fetchModelCheckerPair(kind)).model.findOne({_id:entity_id});
        } catch (exception) {
            throw exception.code ? exception : { code: 500, message: "Error while fetching belongs_to" }
        }
    }

    /**
     * Checks if the given belongs-to relaton is permitted (all participants can access the given entity id etc...)
     * @param entity_id : mongodb id of entity
     * @param kind : string entity kind
     * @param profile_id1 (id of profile 1)
     * @param profile_id2 (id of profile 2)
     */
    async belongsToAccepted(entity_id, kind: string, profile_id1?, profile_id2?) {
        let err, entity, checker_pair, profile1, profile2;
        if (!EventService.validBelongsToTypes().includes(kind)) {
            throw { code: 400, message: "Invalid belongs_to kind. Allowed: " + EventService.validBelongsToTypes() }
        }
        if (profile_id1) {
            [err, profile1] = await to(this.profileModel.findOne({_id:profile_id1}));
            if(err){throw err.code ? err : {code:404, message: "Belongs-to participant not found: "+profile_id1}}
        }
        if (profile_id2) {
            [err, profile2] = await to(this.profileModel.findOne({_id:profile_id2}));
            if(err){throw err.code ? err : {code:404, message: "Belongs-to participant not found: "+profile_id2}}
        }
        [err, entity] = await to(this.fetchBelongsTo(entity_id, kind));
        if(err){throw err.code ? err : {code:500, message: "Error while fetching belongs-to-entity: "+entity_id}}
        if(!entity){throw {code:404, message: "Belongs-to entity not found"}}
        [err, checker_pair] = await (to(this.fetchModelCheckerPair(kind)));
        if (err){throw {code:500, message: "Error while determining belongs-to entity model"}}
        const checker: CheckerIF = checker_pair.checker;
        try {
            return await checker.belongsToAccepted(entity, profile1, profile2);
        } catch (exception) {
            throw exception.code ? exception : { code: 500, message: "Error while checking belongs-to" }
        }
    }

}