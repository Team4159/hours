import AWS from 'aws-sdk';

let cachedClient = null;

const TableName = 'Hours';

const connectToDatabase = () => {
  if (cachedClient) {
    return cachedClient;
  }

  const options = {
    convertEmptyValues: true,
    region: 'us-east-2'
  };

  const client = new AWS.DynamoDB.DocumentClient(options);

  cachedClient = client;
  return client;
};

export const getUsers = async () => {
  const { Items } = await connectToDatabase()
    .scan({
      TableName
    })
    .promise();

  return Items;
}
