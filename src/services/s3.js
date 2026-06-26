const { S3Client } = require("@aws-sdk/client-s3");
const config = require("../config/env");

const s3 = new S3Client({
  endpoint: config.s3.endpoint,
  region: config.s3.region,
  credentials: {
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey,
  },
  forcePathStyle: config.s3.endpoint?.includes("localhost"), // для MinIO
});

module.exports = s3;