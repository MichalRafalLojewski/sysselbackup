import UserController from './UserController';
import ValidationMiddleware from '../../general/middleware/ValidationMiddleware';
import AuthMiddleware from '../../general/middleware/AuthMiddleware';
import UserJoiSchema from './UserJoiSchema';
import GeneralJoiSchema from '../../general/JoiSchemas/GeneralJoiSchema';
import ProfileJoiSchema from '../profile/ProfileJoiSchema';

export default class UserRoutes {
  constructor(app, userController: UserController, validationMiddleware: ValidationMiddleware, authMiddleware: AuthMiddleware, userSchema: UserJoiSchema, profileSchema: ProfileJoiSchema, generalSchema: GeneralJoiSchema) {
    // ---------- Provider ----------
    app.post('/provider/user/register', validationMiddleware.validateBody(userSchema.create), userController.registerProvider.bind(userController));
    app.get('/provider/stripe/onboarding', authMiddleware.user, userController.onBoarding.bind(userController));

    // ---------- USER ----------
    app.post('/user/login', userController.login.bind(userController));

    app.post('/user/invalidateTokens', authMiddleware.user, userController.invalidateTokens.bind(userController));

    app.post('/user/register', validationMiddleware.validateBody(userSchema.create), userController.register.bind(userController));

    app.post(
      '/user/both/register',
      validationMiddleware.validateBody({
        user: userSchema.create,
        profile: profileSchema.create,
      }),
      userController.registerBoth.bind(userController)
    );

    app.post('/user/update', authMiddleware.user, validationMiddleware.validateBody(userSchema.update), userController.update.bind(userController));

    app.get('/user/fetch', authMiddleware.user, validationMiddleware.validateQuery(generalSchema.populateFields), userController.fetch.bind(userController));

    app.get(
      '/user/fetchAny',
      authMiddleware.admin,
      validationMiddleware.validateQuery(
        generalSchema.populateFields,
        generalSchema.orderByFilterLimit,
        generalSchema.olderThan,
        generalSchema.newerThan,
        generalSchema.search,
        generalSchema.populateFields,
        generalSchema.filterByLocation,
        generalSchema.type
      ),
      userController.fetchAny.bind(userController)
    );

    app.post('/user/changePassword', authMiddleware.user, validationMiddleware.validateBody(userSchema.changePassword), userController.changePassword.bind(userController));

    app.get(
      '/user/fetch/:id',
      authMiddleware.optional,
      validationMiddleware.validateParams(generalSchema.fetchById),
      validationMiddleware.validateQuery(generalSchema.populateFields),
      userController.fetchById.bind(userController)
    );

    app.delete('/user/client_tokens/delete/:token', authMiddleware.strict, userController.removeClientToken.bind(userController));

    app.post('/user/client_tokens/add', authMiddleware.strict, validationMiddleware.validateBody(userSchema.registerClientToken), userController.registerClientToken.bind(userController));

    app.post('/user/password/reset', authMiddleware.optional, validationMiddleware.validateBody(userSchema.resetPassword), userController.resetPassword.bind(userController));

    app.post('/user/password/perform_reset', authMiddleware.optional, validationMiddleware.validateBody(userSchema.performPasswordReset), userController.performPasswordReset.bind(userController));
  }
}
