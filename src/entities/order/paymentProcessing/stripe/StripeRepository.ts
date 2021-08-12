import to from 'await-to-js';
import LoggerIF from '../../../../general/loggers/LoggerIF';
import { UserIF, UserType } from '../../../user/UserIF';
import OrderIF from '../../OrderIF';
import { PaymentIntentResultIF } from './StripeIF';

export default class StripeRepository {
  private stripeGateway;
  private logger: LoggerIF;
  private host: string;

  constructor(stripeGateway, logger: LoggerIF, host) {
    this.stripeGateway = stripeGateway;
    this.host = host;
    this.logger = logger;
  }

  /**
   * Creates stripe express account
   * @param email
   * @returns account object
   */

  async createAccount(email: string): Promise<any> {
    let err, accountRes;
    [err, accountRes] = await to(
      this.stripeGateway.accounts.create({
        country: 'NO',
        type: 'express',
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      })
    );
    if (err) {
      this.logger.error('StripeRepository', 'Error creating express account', err);
      throw err.code ? err : { code: 500, message: 'Error creating stripe account' };
    }
    return accountRes;
  }

  async onBoarding(user: UserIF): Promise<any> {
    let err, account, accountLink;

    if (user.type === UserType.ADMIN) return { success: true };

    [err, account] = await to(this.stripeGateway.accounts.retrieve(user.payment_account));
    if (err) {
      this.logger.error('StripeRepository', 'Error retrieving express account', err);
      throw err.code ? err : { code: 500, message: 'Error retrieving express stripe account' };
    }

    if (account.charges_enabled) return { success: true };

    console.log(this.host);

    [err, accountLink] = await to(
      this.stripeGateway.accountLinks.create({
        account: account.id,
        refresh_url: this.host,
        return_url: this.host,
        type: 'account_onboarding',
      })
    );

    if (err) {
      this.logger.error('StripeRepository', 'Error retrieving account link', err);
      throw err.code ? err : { code: 500, message: 'Error retrieving stripe accountlink' };
    }

    console.log(accountLink);

    return { success: false, accountLink };
  }

  /**
   * Performs a stripe payment intent
   * @param order
   * @param accountId - stripe express account of seller
   * @returns paymentIntent result
   */

  async performPaymentIntent(order: OrderIF, accountId: string, currentUser: UserIF): Promise<PaymentIntentResultIF> {
    let err, paymentIntent, customer, ephemeralKey;

    let amount = order.total_price * 100;

    [err, customer] = await to(this.getCustomer(currentUser));

    if (err) throw err;

    paymentIntent = await this.findPaymentIntent(customer.id, order._id);

    if (!paymentIntent) {
      [err, paymentIntent] = await to(
        this.stripeGateway.paymentIntents.create({
          payment_method_types: ['card'],
          amount,
          currency: 'nok',
          application_fee_amount: 1000,
          transfer_data: {
            destination: accountId,
          },
          metadata: {
            order_id: String(order._id),
            customer_id: String(currentUser._id), // use for payment intents retrival
          },
          customer: customer.id,
          description: `Order : ${order._id}`,
        })
      );

      if (err) {
        this.logger.error('StripeRepository', 'Error creating Payment Intent', err);
        throw err.code ? err : { code: 500, message: 'Error creating Payment Intent' };
      }
    }

    [err, ephemeralKey] = await to(this.stripeGateway.ephemeralKeys.create({ customer: customer.id }, { apiVersion: '2020-08-27' }));

    if (err) {
      this.logger.error('StripeRepository', 'Error creating ephemeral key', err);
      throw err.code ? err : { code: 500, message: 'Error creating ephemeral key' };
    }

    return {
      paymentIntent: paymentIntent.client_secret,
      customer: customer.id,
      ephemeralKey: ephemeralKey.secret,
    };
  }

  /**
   * Gets previously created paymentIntent for the buyer
   * @param customer - stripe customer_id ( buyer )
   * @param order_id - order id
   * @returns stripe paymentIntent
   */

  async findPaymentIntent(customer: string, order_id: string): Promise<any> {
    let err, paymentIntents;

    [err, paymentIntents] = await to(this.stripeGateway.paymentIntents.list({ customer }));

    if (err) {
      this.logger.error('StripeRepository', 'Error finding paymentIntent', err);
      throw err.code ? err : { code: 500, message: 'Error finding paymentIntent' };
    }

    return paymentIntents.data.find((item: any) => item.metadata.order_id === String(order_id));
  }

  /**
   * Gets Stripe Customer
   * @param currentUser - buyer
   * @returns stripe customer object
   */

  async getCustomer(currentUser: UserIF): Promise<any> {
    let err, customers, customer;

    [err, customers] = await to(this.stripeGateway.customers.list({ email: currentUser.email }));

    if (err) {
      this.logger.error('StripeRepository', 'Error retriving customer', err);
      throw err.code ? err : { code: 500, message: 'Error retriving stripe customer' };
    }

    if (customers.data.length > 0) {
      return customers.data[0];
    } else {
      [err, customer] = await to(
        this.stripeGateway.customers.create({
          description: `${currentUser.first_name} ${currentUser.last_name}`,
          email: currentUser.email,
          metadata: {
            customer_id: String(currentUser._id),
          },
        })
      );

      if (err) {
        this.logger.error('StripeRepository', 'Error creating customer', err);
        throw err.code ? err : { code: 500, message: 'Error creating stripe customer' };
      }

      return customer;
    }
  }
}
