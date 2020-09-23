import { NextApiRequest, NextApiResponse } from 'next';

import { changeSessionTime } from '@/utils/dynamodb';

export default (req: NextApiRequest, res: NextApiResponse) => {
  changeSessionTime(req.query.password as string, req.query.sessionEnd as string, req.query.sessionTime as string)
    .then(() => res.status(200).end('Success'))
    .catch(err => res.status(400).end(err.toString()));
};
