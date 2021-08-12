import {UserIF} from "../../entities/user/UserIF";
import UserAuthCertificate from "../../entities/user/UserAuthCertificate";

export default class TokenDispenser
{
  private jwt;
  private jwtOptions;

  constructor(jwt, jwtOptions){
    this.jwt = jwt;
    this.jwtOptions = jwtOptions;
  }
  
  /**
  * Generates a JWT token for the given payload
  */
  sign(payload)
  {
    return this.jwt.sign(payload, this.jwtOptions.secretOrKey);
  }

  /**
   * Generates a bearer token for the the given user
   * @param user 
   */
  issueBearerToken(user : UserIF): string
  {
    const me = this;
    const authCertificate: UserAuthCertificate = new UserAuthCertificate(user._id, Math.round((new Date()).getTime() / 1000), user.token_version);
    return me.sign(authCertificate.json());
  }
}
