import { DynamoDB, DynamoDBClientConfig } from "npm:@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "npm:@aws-sdk/lib-dynamodb";
import { DynamoDBAdapter } from "npm:@auth/dynamodb-adapter";

const accessKeyId = Deno.env.get("DYNAMODB_AWS_ACCESS_KEY");
const secretAccessKey = Deno.env.get("DYNAMODB_AWS_SECRET_KEY");

if (!accessKeyId || !secretAccessKey) {
  throw new Error(
    "DYNAMODB_AWS_ACCESS_KEY and DYNAMODB_AWS_SECRET_KEY must be set",
  );
}

const config: DynamoDBClientConfig = {
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  region: Deno.env.get("DYNAMODB_AWS_REGION"),
};

const dynamodbClient = DynamoDBDocument.from(new DynamoDB(config), {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
});

export const dynamodbAdapter = DynamoDBAdapter(dynamodbClient, {
  tableName: "stock-trend-strategy-users",
});
