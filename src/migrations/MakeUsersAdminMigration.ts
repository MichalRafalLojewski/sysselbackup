import { UserIF, UserType } from "../entities/user/UserIF";
import UserService from "../entities/user/UserService";
import MigrationIF from "./MigrationIF";

/**
 * Takes a list of user-ids and makes the given users admin
 */
export default class MakeUsersAdminMigration implements MigrationIF {
  private userService: UserService
  constructor(userService: UserService) {
    this.userService = userService;
  }

  async doMigration() {
    const userIds = ["6056874b01fcff0629dcedfd"];
    userIds.forEach(async (userId) => {
      try {
        const user: UserIF = await this.userService.fetchById(userId);
        if (user) {
          user.type = UserType.ADMIN;
          try {
            await user.save();
            console.log("User made admin: " + userId + " (SUCCESS)");
          } catch (err) {
            console.error("Error saving user with id " + userId);
            console.log(err);
          }
        } else {
          console.log("User not found: " + userId);
        }
      } catch (err) {
        {
          console.log(err);
          console.error("Error fetching user with id: " + userId);
        }
      }
    }
    );

  }
}

