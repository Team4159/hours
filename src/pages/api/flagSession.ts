import { NextApiRequest, NextApiResponse } from 'next';

import { flagSession } from '@/utils/dynamodb';

export default (req: NextApiRequest, res: NextApiResponse) => {
  flagSession(req.query.password, req.query.sessionEnd)
    .then(() => res.status(200).end('Success'))
    .catch(err => res.status(400).end(err.toString()));
};
