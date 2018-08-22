import React from 'react';
import PostIcon from '@material-ui/icons/Book';
import UserIcon from '@material-ui/icons/Group';
import { Admin, Resource } from 'react-admin';
import dataProvider from './dataProvider';

import { KeysList, KeyEdit, KeyCreate, KeyShow } from './keys';
import { AccountList } from './accounts';
import Dashboard from './Dashboard';
import authProvider from './authProvider';

const App = () => (
  <Admin
    dataProvider={dataProvider}
    authProvider={authProvider}
    dashboard={Dashboard}
  >
    <Resource
      name="keys"
      icon={PostIcon}
      list={KeysList}
      edit={KeyEdit}
      create={KeyCreate}
      show={KeyShow}
    />
    <Resource name="accounts" icon={UserIcon} list={AccountList} />
  </Admin>
);
export default App;
