import ItemController from './ItemController';
import ValidationMiddleware from '../../general/middleware/ValidationMiddleware';
import AuthMiddleware from '../../general/middleware/AuthMiddleware';
import ItemJoiSchema from './ItemJoiSchema';
import GeneralJoiSchema from '../../general/JoiSchemas/GeneralJoiSchema';

export default class ItemRoutes {
  constructor(app, itemController: ItemController, validationMiddleware: ValidationMiddleware, authMiddleware: AuthMiddleware, itemSchema: ItemJoiSchema, generalSchema: GeneralJoiSchema) {
    app.post('/item/create', authMiddleware.strict, validationMiddleware.validateBody(itemSchema.create), itemController.create.bind(itemController));

    app.post('/item/update', authMiddleware.strict, validationMiddleware.validateBody(itemSchema.update), itemController.update.bind(itemController));

    app.get(
      '/item/fetchByProfile', // middleware:
      authMiddleware.optional,
      validationMiddleware.validateQuery(
        // schemas:
        generalSchema.fetchById,
        generalSchema.olderThan,
        generalSchema.newerThan,
        generalSchema.orderByFilterLimit,
        generalSchema.populateFields,
        generalSchema.search,
        itemSchema.fetchFilters,
        generalSchema.filterByLocation,
        generalSchema.filterByOwner
      ), // controller function:
      itemController.fetchByProfile.bind(itemController)
    );

    app.get(
      '/item/fetchByCampaign', // middleware:
      authMiddleware.optional,
      validationMiddleware.validateQuery(
        // schemas:
        generalSchema.fetchById,
        generalSchema.olderThan,
        generalSchema.newerThan,
        generalSchema.orderByFilterLimit,
        generalSchema.populateFields,
        itemSchema.fetchFilters,
        generalSchema.search,
        generalSchema.filterByOwner,
        generalSchema.filterByLocation
      ), // controller function:
      itemController.fetchByCampaign.bind(itemController)
    );

    app.get(
      '/item/fetchByIds', // middleware:
      authMiddleware.optional,
      validationMiddleware.validateQuery(
        // schemas:
        generalSchema.olderThan,
        generalSchema.newerThan,
        generalSchema.orderByFilterLimit,
        generalSchema.populateFields,
        itemSchema.fetchFilters,
        itemSchema.fetchByIds,
        generalSchema.search,
        generalSchema.filterByOwner,
        generalSchema.filterByLocation
      ), // controller function:
      itemController.fetchByIds.bind(itemController)
    );

    app.get('/item/fetch/:id', authMiddleware.optional, validationMiddleware.validateParams(generalSchema.fetchById), validationMiddleware.validateQuery(generalSchema.populateFields), itemController.fetchById.bind(itemController)); // owner-version of fetch by id - exposes potentially private info to owner only

    app.delete('/item/delete/:id', authMiddleware.strict, validationMiddleware.validateParams(generalSchema.fetchById), itemController.deleteById.bind(itemController));

    app.get(
      '/item/fromSubscriptions', // middleware:
      authMiddleware.strict,
      validationMiddleware.validateQuery(
        // schemas:
        generalSchema.orderByFilterLimit,
        generalSchema.category,
        generalSchema.search,
        generalSchema.newerThan,
        generalSchema.olderThan,
        generalSchema.populateFields,
        itemSchema.fetchFilters,
        generalSchema.filterByOwner,
        generalSchema.filterByLocation
      ), // controller function:
      itemController.fetchSubscriptionItems.bind(itemController)
    );

    app.get(
      '/item/fetchAny', // middleware:
      authMiddleware.optional,
      validationMiddleware.validateQuery(
        // schemas:
        generalSchema.orderByFilterLimit,
        generalSchema.category,
        generalSchema.search,
        generalSchema.newerThan,
        generalSchema.olderThan,
        generalSchema.search,
        generalSchema.populateFields,
        itemSchema.fetchFilters,
        generalSchema.filterByOwner,
        generalSchema.filterByLocation
      ), // controller function:
      itemController.fetchAny.bind(itemController)
    );
  }
}
