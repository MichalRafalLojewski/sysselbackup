import ProfileIF from "../profile/ProfileIF";
import ItemIF from "./ItemIF";
import GeneralModelService from "../../general/services/GeneralModelService";

export default class ItemChecker{
private generalModelService: GeneralModelService;

constructor(generalModelService: GeneralModelService){
    this.generalModelService = generalModelService;
}
    
/**
 * Checks if the given profile can access the given item
 * @param profile 
 * @param item 
 */
    profileCanAccessItem(profile: ProfileIF, item: ItemIF)
    {
        const me = this;
        return (item.active == true || me.generalModelService.profileCanEditObj(profile, item));
    }
}