import to from 'await-to-js';

/**
 * Module containing stripe middleware functions
 */

export default class StripeMiddleware {
  public webhook;

  constructor(stripeGateway, endpointSecret, responseService) {
    /**
     * Returns a parsed webhoook payload from stripe
     * (if not originated from stripe, the request will be halted with a "bad request" response)
     */
    this.webhook = async (req, res, next) => {
      let event;
      try {
        const sig = req.headers['stripe-signature'];
        event = await stripeGateway.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
        req.stripeWebhook = event.data.object;
        next();
      } catch (err) {
        return responseService.respond(res, 400, { message: 'Bad webhook request' });
      }
    };
  }
}
