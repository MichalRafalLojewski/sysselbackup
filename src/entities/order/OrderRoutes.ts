import OrderController from './OrderController';
import ValidationMiddleware from '../../general/middleware/ValidationMiddleware';
import AuthMiddleware from '../../general/middleware/AuthMiddleware';
import OrderJoiSchema from './OrderJoiSchema';
import GeneralJoiSchema from '../../general/JoiSchemas/GeneralJoiSchema';
import StripeMiddleware from '../../general/middleware/StripeMiddleware';

export default class OrderRoutes {
  constructor(app, orderController: OrderController, validationMiddleware: ValidationMiddleware, authMiddleware: AuthMiddleware, stripeMiddleware: StripeMiddleware, orderSchema: OrderJoiSchema, generalSchema: GeneralJoiSchema) {
    app.post('/order/create', authMiddleware.strict, validationMiddleware.validateBody(orderSchema.create), orderController.create.bind(orderController));

    app.get(
      '/order/fetch/:id',
      authMiddleware.adminOrStrict,
      validationMiddleware.validateParams(generalSchema.fetchById),
      validationMiddleware.validateQuery(generalSchema.populateFields),
      orderController.fetchById.bind(orderController)
    );

    app.get(
      '/order/fetchAny', // middleware:
      authMiddleware.admin,
      validationMiddleware.validateQuery(
        // schemas:
        generalSchema.orderByFilterLimit,
        generalSchema.newerThan,
        generalSchema.olderThan,
        generalSchema.populateFields,
        generalSchema.search,
        orderSchema.buyerSeller,
        orderSchema.hasParticipant,
        orderSchema.paid,
        orderSchema.status
      ), // controller function:
      orderController.fetchAny.bind(orderController)
    );

    app.get(
      '/order/fetchByCurrent', // middleware:
      authMiddleware.strict,
      validationMiddleware.validateQuery(
        // schemas:
        generalSchema.orderByFilterLimit,
        generalSchema.newerThan,
        generalSchema.olderThan,
        generalSchema.populateFields,
        generalSchema.search,
        orderSchema.buyerSeller,
        orderSchema.paid,
        orderSchema.status
      ), // controller function:
      orderController.fetchMultiple.bind(orderController)
    );

    app.post('/order/accept/:id', authMiddleware.strict, validationMiddleware.validateParams(generalSchema.fetchById), validationMiddleware.validateBody(orderSchema.accept), orderController.accept.bind(orderController));

    app.post('/order/reject/:id', authMiddleware.strict, validationMiddleware.validateParams(generalSchema.fetchById), orderController.reject.bind(orderController));

    app.post('/order/seller/delivery_confirmed/:id', authMiddleware.strict, validationMiddleware.validateParams(generalSchema.fetchById), orderController.sellerDeliveryConfirmed.bind(orderController));

    app.post('/order/buyer/delivery_confirmed/:id', authMiddleware.strict, validationMiddleware.validateParams(generalSchema.fetchById), orderController.buyerDeliveryConfirmed.bind(orderController));

    app.post('/order/seller/payment_confirmed/:id', authMiddleware.strict, validationMiddleware.validateParams(generalSchema.fetchById), orderController.sellerPaymentConfirmed.bind(orderController));

    app.post('/order/buyer/payment_confirmed/:id', authMiddleware.strict, validationMiddleware.validateParams(generalSchema.fetchById), orderController.buyerPaymentConfirmed.bind(orderController));

    app.post('/order/cancel/:id', authMiddleware.strict, validationMiddleware.validateParams(generalSchema.fetchById), orderController.cancel.bind(orderController));

    app.post(
      '/order/update_delivery_date/:id',
      authMiddleware.strict,
      validationMiddleware.validateParams(generalSchema.fetchById),
      validationMiddleware.validateBody(orderSchema.updateDeliveryDate),
      orderController.updateDeliveryDate.bind(orderController)
    );

    // PAYMENT & WEBHOOK ROUTES:

    // STRIPE:
    app.post('/order/pay/stripe/checkout/:id', authMiddleware.user, validationMiddleware.validateParams(generalSchema.fetchById), orderController.checkout.bind(orderController));

    app.post('/order/pay/stripe/webhook', stripeMiddleware.webhook, orderController.confirmPayment.bind(orderController));
  }
}
