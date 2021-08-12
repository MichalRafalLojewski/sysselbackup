/**
 * Holds token-information needed for bearer token auth
 */
export default class UserAuthCertificate{
    public id: string;
    public issued_timestamp: number;
    public token_version: number;

    constructor(user_id, issued_timestamp: number, token_version: number){
        this.id = user_id;
        this.issued_timestamp = issued_timestamp;
        this.token_version = token_version;
    }

    json(){
        const me = this;
        return {id: me.id, issued_timestamp: me.issued_timestamp, token_version: me.token_version}
    }
}