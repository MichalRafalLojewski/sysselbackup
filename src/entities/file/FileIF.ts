import { MongodbEntityIF } from "../MongodbEntityIF";

export default interface FileIF extends MongodbEntityIF{
    size_bytes: number;
    public_url: string;
    file_key: string;
}