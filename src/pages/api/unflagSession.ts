import { NextApiRequest, NextApiResponse } from 'next';

import { unflagSession } from '@/utils/dynamodb';

export default (req: NextApiRequest, res: NextApiResponse) => {
  unflagSession(req.query.password, req.query.sessionEnd)
    .then(() => res.status(200).end('Success'))
    .catch(err => res.status(400).end(err.toString()));
};
