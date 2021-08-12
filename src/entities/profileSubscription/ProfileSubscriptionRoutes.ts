import ProfileSubscriptionController from "./ProfileSubscriptionController";
import ValidationMiddleware from "../../general/middleware/ValidationMiddleware";
import AuthMiddleware from "../../general/middleware/AuthMiddleware";
import GeneralJoiSchema from "../../general/JoiSchemas/GeneralJoiSchema";

export default class ProfileSubscriptionRoutes{
  
  constructor(app, profileSubscriptionController: ProfileSubscriptionController, validationMiddleware: ValidationMiddleware, authMiddleware: AuthMiddleware, generalSchema: GeneralJoiSchema){
     app.post("/subscriptions/subscribe",
     authMiddleware.strict,
     validationMiddleware.validateBody( generalSchema.fetchById),
     profileSubscriptionController.subscribe.bind(profileSubscriptionController));

     app.get("/subscriptions/fetch/:id", // id of subscribe_to profile
     authMiddleware.strict,
     validationMiddleware.validateParams(generalSchema.fetchById),
     validationMiddleware.validateQuery(generalSchema.populateFields),
     profileSubscriptionController.fetchSubscription.bind(profileSubscriptionController));

     app.post("/subscriptions/unsubscribe",
     authMiddleware.strict,
     validationMiddleware.validateBody( generalSchema.fetchById),
     profileSubscriptionController.unsubscribe.bind(profileSubscriptionController));

     // ------- SUBSCRIPTION OBJECTS ---------
     app.get("/subscriptions/fetchBySubscribingTo/:id", // middleware:
     authMiddleware.strict,
     validationMiddleware.validateQuery( // schemas:
       generalSchema.orderByFilterLimit,
       generalSchema.olderThan,
       generalSchema.newerThan,
       generalSchema.populateFields
     ),// controller function:
     profileSubscriptionController.fetchBySubscribingTo.bind(profileSubscriptionController));

     app.get("/subscriptions/fetchBySubscriber/:id", // middleware:
     authMiddleware.strict,
     validationMiddleware.validateQuery( // schemas:
       generalSchema.orderByFilterLimit,
       generalSchema.olderThan,
       generalSchema.newerThan,
       generalSchema.populateFields
     ),// controller function:
     profileSubscriptionController.fetchBySubscriber.bind(profileSubscriptionController));

    // ------- SUBSCRIPTION PROFILES ---------
     app.get("/subscriptions/profile/fetchBySubscribingTo/:id", // middleware:
     authMiddleware.strict,
     validationMiddleware.validateQuery( // schemas:
       generalSchema.orderByFilterLimit,
       generalSchema.olderThan,
       generalSchema.newerThan,
       generalSchema.filterByLocation,
       generalSchema.populateFields
     ),// controller function:
     profileSubscriptionController.fetchProfilesBySubscribingTo.bind(profileSubscriptionController));

     app.get("/subscriptions/profile/fetchBySubscriber/:id", // middleware:
     authMiddleware.strict,
     validationMiddleware.validateQuery( // schemas:
       generalSchema.orderByFilterLimit,
       generalSchema.olderThan,
       generalSchema.newerThan,
       generalSchema.filterByLocation,
       generalSchema.populateFields
     ),// controller function:
     profileSubscriptionController.fetchProfilesBySubscriber.bind(profileSubscriptionController));

// TODO:  ADD ENDPOINTS FOR FETCHING SUBSCRIPTIONS

}
}