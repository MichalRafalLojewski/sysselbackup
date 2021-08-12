import FileUploadServiceIF from "../../../general/FileUploadServiceIF";

export default class S3FileService implements FileUploadServiceIF {
    private aws_s3_bucket_sdk: AWS.S3;
    private bucketName: string;

    constructor(bucketName: string, aws_s3_bucket_sdk: AWS.S3) {
        this.bucketName = bucketName;
        this.aws_s3_bucket_sdk = aws_s3_bucket_sdk;
    }

    /**
     * 
     * @param file (from req.file)
     */
    upload(file_key: string, file) {
        const me = this;
        return new Promise((resolve, reject) => {
            const params = {
                Bucket: me.bucketName,
                Key: file_key,
                Body: file.buffer,
                ContentType: file.mimetype,
                ACL: "public-read"
            };
            me.aws_s3_bucket_sdk.upload(params, function (err, response) {
                if (err) {
                    return reject(err);
                }
                // upload successful
                resolve(response);
            });
        });
    }

    deleteByKey(file_key) {
        const me = this;
        return new Promise((resolve, reject) => {
            const params = {
                Bucket: me.bucketName,
                Key: file_key
            };
            me.aws_s3_bucket_sdk.deleteObject(params, (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve(result);
            });
        });
    }

    deleteMultipleByKey(file_keys: string[]) {
        const me = this;
        return new Promise((resolve, reject) => {
            const params = {
                Bucket: me.bucketName,
                Delete: {
                    Objects: file_keys.map(key => { 
                        return {Key: key}
                    }),
                    Quiet: false
                }
            };
            me.aws_s3_bucket_sdk.deleteObjects(params, (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve(result);
            });
        });
    }
}