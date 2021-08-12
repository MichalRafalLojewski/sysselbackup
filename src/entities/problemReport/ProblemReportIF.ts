import { MongodbEntityIF } from "../MongodbEntityIF";
import ProfileIF from "../profile/ProfileIF";

export enum ProblemReportType {
    DELIVERY_PROBLEM = "DELIVERY_PROBLEM"
}
export default interface ProblemReportIF extends MongodbEntityIF {
    type: ProblemReportType | string;
    title: string;
    description: string;
    owner_profile: ProfileIF | string;
}