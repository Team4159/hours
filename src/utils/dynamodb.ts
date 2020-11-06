import AWS from 'aws-sdk';

let cachedClient: AWS.DynamoDB.DocumentClient = null;

const TableName = 'Hours';

const connectToDatabase = (): AWS.DynamoDB.DocumentClient => {
  AWS.config.credentials = new AWS.Credentials({
    accessKeyId: process.env['ACCESS_KEY_ID'],
    secretAccessKey: process.env['SECRET_ACCESS_KEY'],
  });

  if (cachedClient) {
    return cachedClient;
  }

  const options = {
    convertEmptyValues: true,
    region: 'us-east-2',
  };

  const client = new AWS.DynamoDB.DocumentClient(options);

  cachedClient = client;
  return client;
};

const getUserByPassword = async (password: string) => {
  const { Items } = await connectToDatabase()
    .scan({
      TableName,
      FilterExpression: 'password = :password',
      ExpressionAttributeValues: {
        ':password': password,
      },
    })
    .promise();

  return Items[0];
};

const updateSessions = async (password: string, sessions: any) => {
  await connectToDatabase()
    .update({
      TableName,
      Key: {
        password,
      },
      UpdateExpression: 'set sessions=:sessions, totalTime=:totalTime',
      ExpressionAttributeValues: {
        ':totalTime': sessions
          .filter((session) => !session.flagged)
          .reduce((sum, session) => (sum += session.time), 0),
        ':sessions': sessions,
      },
    })
    .promise();
};

export const getUsers = async () => {
  const { Items } = await connectToDatabase()
    .scan({
      TableName,
    })
    .promise();

  return Items;
};

export const flagSession = async (password: string, sessionEnd: string) => {
  const user = await getUserByPassword(password);

  if (user) {
    const sessions = user.sessions;
    const session = sessions.find(
      (session) => session.date == parseInt(sessionEnd)
    );
    if (session && !session.flagged) {
      session.flagged = true;
      await updateSessions(password, sessions);
    } else {
      throw new Error('Session not found');
    }
  } else {
    throw new Error('User not found');
  }
};

export const unflagSession = async (password, sessionEnd) => {
  const user = await getUserByPassword(password);

  if (user) {
    const sessions = user.sessions;
    const session = sessions.find(
      (session) => session.date == parseInt(sessionEnd)
    );
    if (session && session.flagged) {
      session.flagged = false;
      await updateSessions(password, sessions);
    } else {
      throw new Error('Session not found');
    }
  } else {
    throw new Error('User not found');
  }
};

export const changeSessionTime = async (password, sessionEnd, sessionTime) => {
  if (isNaN(+sessionTime)) {
    throw new Error('Session time is invalid');
  }

  const user = await getUserByPassword(password);

  if (user) {
    const sessions = user.sessions;
    const session = sessions.find((session) => session.date == sessionEnd);
    if (session) {
      session.date -= session.time;
      session.time = +sessionTime;
      session.date += session.time;
      await updateSessions(password, sessions);
    } else {
      throw new Error('Session not found');
    }
  } else {
    throw new Error('User not found');
  }
};
