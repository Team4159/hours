import React from 'react';
import { getUsers } from '../utils/dynamodb';

const AdminPage = (props) => {
  return JSON.stringify(props);
};

export default AdminPage;

export const getServerSideProps = async () => {
  return {
    props: {
      users: await getUsers()
    }
  };
}
