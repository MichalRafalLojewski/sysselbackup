import ProfileIF from "../profile/ProfileIF";

export default class MessageChecker{
    async canSend(sender: ProfileIF, receiver: ProfileIF): Promise<boolean>{
        return sender._id.toString() != receiver._id.toString();
    }
}