import to from "await-to-js";
import LoggerIF from "../../general/loggers/LoggerIF";
import QueryService from "../../general/services/QueryService";
import CategoryIF from "./CategoryIF";

export default class CategoryService {
  private categoryModel;
  private queryService: QueryService;
  private logger: LoggerIF;

  constructor(queryService: QueryService, categoryModel, logger: LoggerIF) {
    this.categoryModel = categoryModel;
    this.queryService = queryService;
    this.logger = logger;
  }

  /**
   * Checks if the given object is an event
   */
  isCategory(obj): boolean {
    return obj instanceof this.categoryModel;
  }

  /**
   * Fetches a given conversation by id
   */
  async fetchById(id): Promise<CategoryIF> {
    return await this.categoryModel.findOne({ _id: id });
  }

  /**
  * Creates a new event
  */
  async create(category: CategoryIF): Promise<CategoryIF> {
    this.logger.info("CategoryService", "Creating new category: " + category.title);
    try {
      const event = new this.categoryModel(category);
      return await event.save();
    } catch (exception) {
      this.logger.error("CategoryService", "Error while saving new category", exception);
      throw exception.code ? exception : { code: 500, message: "Error while saving new category" };
    }
  }

  async deleteById(categoryId: string) {
    let err, category: CategoryIF;
    [err, category] = await to(this.fetchById(categoryId));
    if (err) {
      this.logger.error("CategoryService", "Error fetching category: " + categoryId);
      throw err.code ? err : { code: 500, message: "Error while fetching category" };
    }
    if (!category) {
      this.logger.error("CategoryService", "Category not found: " + categoryId);
      throw { code: 404, message: "Category not found" };
    }
    category.deleted = true;
    [err] = await to(category.save());
    if (err) {
      this.logger.error("CategoryService", "Error deleting category: " + categoryId);
      throw err.code ? err : { code: 500, message: "Error deleting category" };
    }
  }


  /**
* Creates a new event
*/
  async update(newBody: CategoryIF): Promise<CategoryIF> {
    let err, updatedCategory: CategoryIF;
    this.logger.info("CategoryService", "Updating category: " + newBody.title);
    [err] = await to(
      this.categoryModel.updateOne({ _id: newBody._id }, newBody)
    );
    [err, updatedCategory] = await to(this.fetchById(newBody._id));
    if (err) {
      this.logger.error("CategoryService", "Error fetching category after save. ID: " + newBody._id);
      throw { code: 500, message: "Error fetching category by id after save" };
    }
    if (!updatedCategory) {
      this.logger.error("CategoryService", "Category not found: " + newBody._id);
      throw { code: 404, message: "Category not found" };
    }
    return updatedCategory;
  }

  /**
   * Fetches all categoreis
   */
  async fetchMultiple(requestBody) {
    return await this.queryService.orderByOffsetLimit(requestBody,
      this.queryService.filterNotDeleted(requestBody,
        this.categoryModel.find({})
      ));
  }


}