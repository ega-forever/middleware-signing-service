import React from 'react';
import {
  Responsive,
  SimpleList,
  List,
  Datagrid,
  EmailField,
  TextField,
} from 'react-admin';

export const AccountList = props => (
  <List title="All accounts" {...props}>
    <Responsive
      small={
        <SimpleList
          primaryText={record => record.address}
        />
      }
      medium={
        <Datagrid>
          <TextField source="address" />
        </Datagrid>
      }
    />
  </List>
);
