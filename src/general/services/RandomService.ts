
/**
 * Generates random numbers and strings  
 */
export default class RandomService{

    /**
     * Generates a random string of given length
     * @param length 
     */
    randomStringSync(length:number): string{
        const pool = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let str = "";
        while(str.length < length){
            const index: number = Math.random()*(pool.length-1);
            str += pool[Math.floor(index)];
        }
        return str;
    }

    /**
     * Generates a random string of given length
     * @param length 
     */
    async randomString(length:number){
        return this.randomStringSync(length);
    }




}