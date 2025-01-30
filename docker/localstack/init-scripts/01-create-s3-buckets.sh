#!/usr/bin/env bash

echo "########### Setting region as env variable ##########"

export AWS_DEFAULT_REGION="eu-west-1"
export AWS_SECRET_ACCESS_KEY="dev-secret-key"
export AWS_ACCESS_KEY_ID="dev-access-key"

REQUEST_BUCKET_NAME="dev-ops-industry-data-replication"

if awslocal --endpoint-url=http://localhost:4566 s3 ls | grep -q $REQUEST_BUCKET_NAME; then
  echo "Bucket $REQUEST_BUCKET_NAME already exists."
else
  awslocal --endpoint-url=http://localhost:4566 s3api create-bucket \
      --bucket $REQUEST_BUCKET_NAME --region $AWS_DEFAULT_REGION \
      --create-bucket-configuration LocationConstraint=$AWS_DEFAULT_REGION
fi

echo "########### Upload test file to s3 ##########"
awslocal --endpoint-url=http://localhost:4566 s3 cp /mount/init-scripts/if-047-example.json s3://dev-ops-industry-data-replication/MHHS/IF-flows/IF-047/2024/08/27/if-047-example.json
