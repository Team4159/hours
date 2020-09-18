import AWS from 'aws-sdk';

let cachedClient: AWS.DynamoDB.DocumentClient = null;

const TableName = 'Hours';

const connectToDatabase = (): AWS.DynamoDB.DocumentClient => {
  AWS.config.credentials = new AWS.Credentials({
    accessKeyId: process.env['ACCESS_KEY_ID'],
    secretAccessKey: process.env['SECRET_ACCESS_KEY']
  });

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

export const flagSession = async (password, sessionEnd) => {
  const { Items } = await connectToDatabase()
    .scan({
      TableName,
      FilterExpression: 'password = :password',
      ExpressionAttributeValues: {
        ':password': password
      }
    })
    .promise();
  
  const user = Items[0];
  if (user) {
    const sessions = user.sessions;
    const sessionIdx = sessions.findIndex(session => session.date == parseInt(sessionEnd));
    const session = sessions[sessionIdx];
    if (session && !session.flagged) {
      session.flagged = true;
      await connectToDatabase()
        .update({
          TableName,
          Key: {
            password: user.password,
          },
          UpdateExpression: 'set sessions=:sessions, totalTime=:totalTime',
          ExpressionAttributeValues:{
            ':totalTime': user.totalTime - session.time,
            ':sessions': sessions.slice(0, sessionIdx).concat([session]).concat(sessions.slice(sessionIdx + 1, sessions.length))
          }
        })
        .promise();
    } else {
      throw new Error('Session not found');
    }
  } else {
    throw new Error('User not found');
  }
}

export const unflagSession = async (password, sessionEnd) => {
  const { Items } = await connectToDatabase()
    .scan({
      TableName,
      FilterExpression: 'password = :password',
      ExpressionAttributeValues: {
        ':password': password
      }
    })
    .promise();
  
  const user = Items[0];
  if (user) {
    const sessions = user.sessions;
    const sessionIdx = sessions.findIndex(session => session.date == parseInt(sessionEnd));
    const session = sessions[sessionIdx];
    if (session && session.flagged) {
      session.flagged = false;
      await connectToDatabase()
        .update({
          TableName,
          Key: {
            password: user.password,
          },
          UpdateExpression: 'set sessions=:sessions, totalTime=:totalTime',
          ExpressionAttributeValues:{
            ':totalTime': user.totalTime + session.time,
            ':sessions': sessions.slice(0, sessionIdx).concat([session]).concat(sessions.slice(sessionIdx + 1, sessions.length))
          }
        })
        .promise();
    } else {
      throw new Error('Session not found');
    }
  } else {
    throw new Error('User not found');
  }
}
