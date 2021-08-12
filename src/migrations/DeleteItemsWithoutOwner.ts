import ItemIF from "../entities/item/ItemIF";
import ItemService from "../entities/item/ItemService";
import MigrationIF from "./MigrationIF";

export default class DeleteItemsWithoutOwner implements MigrationIF {
  private itemService: ItemService;

  constructor(itemService: ItemService) {
    this.itemService = itemService;
  }

  doMigration() {
    this.itemService.fetchAll().then((items: ItemIF[]) => {
      items.forEach(item => {
        if (!item.owner_profile) {
          (item as any).delete();
          console.log("Deleted: " + item._id + " - " + item.title);
        }
      })
    })
  }
}

