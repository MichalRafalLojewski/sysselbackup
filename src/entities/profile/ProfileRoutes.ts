import ProfileController from './ProfileController';
import ValidationMiddleware from '../../general/middleware/ValidationMiddleware';
import AuthMiddleware from '../../general/middleware/AuthMiddleware';
import ProfileJoiSchema from './ProfileJoiSchema';
import GeneralJoiSchema from '../../general/JoiSchemas/GeneralJoiSchema';

export default class ProfileRoutes {
  constructor(app, profileController: ProfileController, validationMiddleware: ValidationMiddleware, authMiddleware: AuthMiddleware, profileSchema: ProfileJoiSchema, generalSchema: GeneralJoiSchema) {
    app.post('/profile/transfer_owner', authMiddleware.admin, validationMiddleware.validateBody(profileSchema.transferOwner), profileController.transferOwner.bind(profileController));

    app.post('/profile/create', authMiddleware.user, validationMiddleware.validateBody(profileSchema.create), profileController.create.bind(profileController));

    app.post('/profile/update', authMiddleware.user, validationMiddleware.validateBody(profileSchema.update), profileController.update.bind(profileController));

    app.delete('/profile/delete/:id', authMiddleware.user, validationMiddleware.validateParams(generalSchema.fetchById), profileController.delete.bind(profileController));

    app.get(
      '/profile/fetch/:id',
      authMiddleware.optional,
      validationMiddleware.validateParams(generalSchema.fetchById),
      validationMiddleware.validateQuery(generalSchema.populateFields, profileSchema.fetchById),
      profileController.fetchById.bind(profileController)
    );

    app.get('/profile/fetchOwnedByCurrent', authMiddleware.user, profileController.fetchOwnedByCurrent.bind(profileController));

    app.get(
      '/profile/fetchByCurrent', // middleware:
      authMiddleware.user,
      validationMiddleware.validateQuery(
        // schemas:
        generalSchema.orderByFilterLimit,
        generalSchema.olderThan,
        generalSchema.newerThan,
        generalSchema.search,
        generalSchema.populateFields,
        generalSchema.filterByLocation,
        profileSchema.fetchMultiple,
        generalSchema.type,
        generalSchema.hasCategory
      ), // controller function:
      profileController.fetchByCurrent.bind(profileController)
    );

    app.get(
      '/profile/fetchAny', // middleware:
      authMiddleware.optional,
      validationMiddleware.validateQuery(
        // schemas:
        generalSchema.orderByFilterLimit,
        generalSchema.olderThan,
        generalSchema.newerThan,
        generalSchema.search,
        generalSchema.populateFields,
        generalSchema.filterByLocation,
        profileSchema.fetchMultiple,
        generalSchema.type,
        generalSchema.hasCategory
      ), // controller function:
      profileController.fetchAny.bind(profileController)
    );

    app.post('/profile/addUser', authMiddleware.user, validationMiddleware.validateBody(profileSchema.addUser), profileController.addUser.bind(profileController));

    // ---- FAVORITES ---- :
    app.post('/favorites/profiles/add', authMiddleware.strict, validationMiddleware.validateBody(generalSchema.fetchById), profileController.addProfileToFavorites.bind(profileController));

    app.post('/favorites/profiles/remove', authMiddleware.strict, validationMiddleware.validateBody(generalSchema.fetchById), profileController.removeProfileFromFavorites.bind(profileController));

    app.post('/favorites/items/add', authMiddleware.strict, validationMiddleware.validateBody(generalSchema.fetchById), profileController.addItemToFavorites.bind(profileController));

    app.post('/favorites/items/remove', authMiddleware.strict, validationMiddleware.validateBody(generalSchema.fetchById), profileController.removeItemFromFavorites.bind(profileController));

    app.get(
      '/favorites/profiles/fetchMultiple', // middleware:
      authMiddleware.strict,
      validationMiddleware.validateQuery(
        // schemas:
        generalSchema.orderByFilterLimit,
        generalSchema.olderThan,
        generalSchema.newerThan,
        generalSchema.search,
        generalSchema.populateFields,
        generalSchema.filterByLocation,
        profileSchema.fetchMultiple,
        generalSchema.type,
        generalSchema.hasCategory
      ), // controller function:
      profileController.fetchFavoriteProfiles.bind(profileController)
    );

    app.get(
      '/favorites/items/fetchMultiple', // middleware:
      authMiddleware.strict,
      validationMiddleware.validateQuery(
        // schemas:
        generalSchema.orderByFilterLimit,
        generalSchema.olderThan,
        generalSchema.newerThan,
        generalSchema.search,
        generalSchema.populateFields,
        generalSchema.filterByLocation
      ), // controller function:
      profileController.fetchFavoriteItems.bind(profileController)
    );
  }
}
