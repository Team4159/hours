import { NextApiResponse } from 'next';

import { getUsers } from '@/utils/dynamodb';

export default (_, res: NextApiResponse) => {
  getUsers()
    .then(users => res.status(200).json(users))
    .catch(err => res.status(500).end(err.toString()));
};
