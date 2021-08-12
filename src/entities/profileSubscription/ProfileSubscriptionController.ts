import ProfileService from "../profile/ProfileService";
import ProfileSubscriptionService from "./ProfileSubscriptionService";
import Responses from "../../general/consts/Responses";
import ResponseService from "../../general/services/ResponseService";
import ProfileSubscriptionIF from "./ProfileSubscriptionIF";
import ProfileIF from "../profile/ProfileIF";
import RequestOutIF from "../RequestOutIF";

export default class ProfileSubscriptionController {
    private profileService: ProfileService;
    private profileSubscriptionService: ProfileSubscriptionService;
    private responses: Responses;
    private responseService: ResponseService;

    constructor(profileService: ProfileService, profileSubscriptionService: ProfileSubscriptionService, responses: Responses, responseService: ResponseService) {
        this.profileService = profileService;
        this.profileSubscriptionService = profileSubscriptionService;
        this.responses = responses;
        this.responseService = responseService;
    }

    /**
     *  Subscribes current profile to given profile
     */
    subscribe(req, res) {
        const me = this,
            anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
            ok = (subscription: ProfileSubscriptionIF) => me.responseService.respond(res, 200, subscription);
        me.profileService.fetchById(req.body.id).then(function (sub_profile: ProfileIF) {
            if (!sub_profile) {
                return anyErr({ code: 404, message: "Not found" });
            }
            me.profileSubscriptionService.subscribe(req.profile, sub_profile).then(ok).catch(anyErr);
        }).catch(anyErr);
    }

    /**
     * Unsubscribes current profile to given profile
     */
    unsubscribe(req, res) {
        const me = this,
            anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
            ok = () => me.responseService.respond(res, 200, { message: me.responses.success });
        me.profileService.fetchById(req.body.id).then(function (sub_profile: ProfileIF) {
            if (!sub_profile) {
                return anyErr({ code: 404, message: "Not found" });
            }
            me.profileSubscriptionService.unsubscribe(req.profile, sub_profile).then(ok).catch(anyErr);
        }).catch(anyErr);
    }

    // ------- SUBSCRIPTION OBJECTS ---------
    /**
    * Fetches all subscription objects where given user is subscribing to someosne else
    */
    fetchBySubscriber(req, res) {
        const me = this,
            anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
            ok = (subscriptions: ProfileSubscriptionIF[]) => me.responseService.respond(res, 200, subscriptions);
        me.profileService.fetchById(req.params.id).then(function (profile: ProfileIF) {
            if (!profile) {
                return anyErr({ code: 404, message: "Not found" });
            }
            me.profileSubscriptionService.fetchBySubscriber(profile, req.query).then(ok).catch(anyErr);
        }).catch(anyErr);
    }

    /**
     * Fetches all subscription objects where given user is being subscirbed to
     */
    fetchBySubscribingTo(req, res) {
        const me = this,
            anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
            ok = (subscriptions: ProfileSubscriptionIF[]) => me.responseService.respond(res, 200, subscriptions);
        me.profileService.fetchById(req.params.id).then(function (profile: ProfileIF) {
            if (!profile) {
                return anyErr({ code: 404, message: "Not found" });
            }
            me.profileSubscriptionService.fetchBySubscribingTo(profile, req.query).then(ok).catch(anyErr);
        }).catch(anyErr);
    }

    // ------- SUBSCRIPTION PROFILES ---------
    /**
     * Fetches all subscription profiles where given user is subscribing to someosne else
     */
    fetchProfilesBySubscriber(req, res) {
        const me = this,
            anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
            ok = (subscriptions: ProfileIF[]) => me.responseService.respond(res, 200, subscriptions);
        me.profileService.fetchById(req.params.id).then(function (profile: ProfileIF) {
            if (!profile) {
                return anyErr({ code: 404, message: "Not found" });
            }
            me.profileSubscriptionService.fetchProfilesBySubscriber(profile, req.query).then(ok).catch(anyErr);
        }).catch(anyErr);
    }

    /**
     * Fetches all subscription profiles where given user is being subscirbed to
     */
    fetchProfilesBySubscribingTo(req, res) {
        const me = this,
            anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
            ok = (subscriptions: ProfileIF[]) => me.responseService.respond(res, 200, subscriptions);
        me.profileService.fetchById(req.params.id).then(function (profile: ProfileIF) {
            if (!profile) {
                return anyErr({ code: 404, message: "Not found" });
            }
            me.profileSubscriptionService.fetchProfilesBySubscribingTo(profile, req.query).then(ok).catch(anyErr);
        }).catch(anyErr);
    }

    /**
     * Fetches a specific profile-subscription between current profile and given profile
     * @param req 
     * @param res 
     */
    fetchSubscription(req, res) {
        const me = this,
            anyErr = (response: RequestOutIF) => me.responseService.respond(res, response.code, { message: response.message }),
            ok = (subscription: ProfileSubscriptionIF) => me.responseService.respond(res, 200, subscription);
        me.profileService.fetchById(req.params.id).then(function (subscribe_to: ProfileIF) {
            if (!subscribe_to) {
                return anyErr({code: 404, message: "Profile not found"});
            }
            me.profileSubscriptionService.fetchSubscription(req.profile, subscribe_to).then((subscription: ProfileSubscriptionIF) => {
                if (!subscription) {
                    return anyErr({code: 404, message: "Subscription not found"});
                }
                ok(subscription);
            }).catch(anyErr);
        }).catch(anyErr);
    }

}