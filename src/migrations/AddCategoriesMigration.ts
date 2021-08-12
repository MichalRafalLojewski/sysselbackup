import CategoryService from "../entities/category/CategoryService";
import MigrationIF from "./MigrationIF";

export default class AddCategoriesMigration implements MigrationIF {
  private categoryService: CategoryService;

  constructor(categoryService: CategoryService) {
    this.categoryService = categoryService;
  }

  doMigration() {
    /*
        const categories = ["Food", "Toys", "Games", "Electronics", "Books", "Construction", "IT", "Science", "Finance", "Delivery", "Transport", "Travel"];
        categories.forEach(category => this.categoryService.create({
          title: category,
          weight: 0
        }));
        */
  }
}

