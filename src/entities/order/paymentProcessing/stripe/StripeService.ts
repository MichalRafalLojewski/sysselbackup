import LoggerIF from '../../../../general/loggers/LoggerIF';
import { UserIF } from '../../../user/UserIF';
import OrderIF from '../../OrderIF';
import { PaymentIntentResultIF } from './StripeIF';
import StripeRepository from './StripeRepository';

export default class StripeService {
  private stripeRepository: StripeRepository;
  private logger: LoggerIF;

  constructor(stripeRepository: StripeRepository, logger: LoggerIF) {
    this.stripeRepository = stripeRepository;
    this.logger = logger;
  }

  /**
   * Creates stripe express account
   * @param email
   * @returns account object
   */

  async createAccount(email: string): Promise<any> {
    return this.stripeRepository.createAccount(email);
  }

  /**
   * Create on_boarding call if not registered yet.
   * @param user <userIF>
   * @returns account link object
   */

  async onBoarding(user: UserIF): Promise<any> {
    return this.stripeRepository.onBoarding(user);
  }

  /**
   * Performs a stripe payment intent
   * @param order
   * @param accountId - stripe express account of seller
   * @returns paymentIntent result
   */

  async performPaymentIntent(order: OrderIF, accountId: string, currentUser: UserIF): Promise<PaymentIntentResultIF> {
    return this.stripeRepository.performPaymentIntent(order, accountId, currentUser);
  }
}
