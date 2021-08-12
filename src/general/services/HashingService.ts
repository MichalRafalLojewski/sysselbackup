/**
* Module for hashing and verifying passwords
* Note: uses async calls for generating hash (use callback functions)
* @param bcrypt package
* @param securityConsts module
*/
export default class HashingService
{
  private bcrypt;
  private securityConsts;

  constructor(bcrypt, securityConsts){
    this.bcrypt = bcrypt;
    this.securityConsts = securityConsts;
  }

  /**
  * Generates a hash from the given password
  * @param password to hash (string)
  * @param callBack function (called with hash as param)
  */
  hash(password): Promise<string>
  {
    const me = this;
    return new Promise(function(resolve,reject){
      me.bcrypt.hash(password + me.securityConsts.salt, 10, function(err, hashVal) {
        if (hashVal)
        {
          resolve(hashVal);
        }else{
          reject(err);
        }
      });
    });
  };

  /**
  * Verifies correct password based on hash
  * @param password to verify
  * @param hash to compare to
  * @param callBack function (called with boolean true/false for correct password)
  */
  verify(password, hash)
  {
    const me = this;
    return new Promise(function(resolve,reject){
      me.bcrypt.compare(password + me.securityConsts.salt, hash, function(err, success) {
        if(success) {
          resolve(true); // match
        } else {
          resolve(false); // no match
        }
      });
    });

  };

};
