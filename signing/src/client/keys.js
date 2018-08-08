import React from 'react';
import {
  Create,
  Datagrid,
  DateField,
  DisabledInput,
  Edit,
  EditButton,
  Filter,
  List,
  LongTextInput,
  ReferenceField,
  ReferenceInput,
  ReferenceManyField,
  RichTextField,
  SelectInput,
  Show,
  ShowButton,
  SimpleForm,
  SimpleShowLayout,
  TextField,
  TextInput,
  AutocompleteInput,
  ArrayInput,
  SimpleFormIterator
} from 'react-admin';

const KeysFilter = props => (
  <Filter {...props}>
    <TextInput label="Search" source="q" alwaysOn/>
    <ReferenceInput
      label="User"
      source="userId"
      reference="users"
      allowEmpty
    >
      <SelectInput optionText="name"/>
    </ReferenceInput>
  </Filter>
);

export const KeysList = props => (
  <List {...props} filters={<KeysFilter/>}>
    <Datagrid>
      <TextField source="address"/>
      <TextField source="owners.length"/>
      <EditButton/>
      <ShowButton/>
    </Datagrid>
  </List>
);

const KeyTitle = ({record}) => {
  return <span>Key {record ? `"${record.address}"` : ''}</span>;
};

export const KeyEdit = props => (
  <Edit title={<KeyTitle/>} {...props}>
    <SimpleForm>
      <DisabledInput source="address"/>
      <DisabledInput source="key"/>

      {/*<ReferenceInput label="User" source="userId" reference="users">
        <SelectInput optionText="name" />
      </ReferenceInput>*/}
      {/*
      <TextInput source="title" />
      <LongTextInput source="body" />

*/}

      <ArrayInput source="children">
        <SimpleFormIterator>
          <DisabledInput source="address" defaultValue={'0x22' + Date.now()} />
          <DisabledInput source="key" />
        </SimpleFormIterator>
      </ArrayInput>


      <ArrayInput source="owners">
        <SimpleFormIterator>
          <ReferenceInput label="owner" reference="accounts" source="address">
            <AutocompleteInput optionText="address" />
          </ReferenceInput>
        </SimpleFormIterator>
      </ArrayInput>

    </SimpleForm>
  </Edit>
);

export const KeyCreate = props => (
  <Create {...props}>
    <SimpleForm>
      <ReferenceInput label="User" source="userId" reference="users">
        <SelectInput optionText="name"/>
      </ReferenceInput>
      <TextInput source="title"/>
      <LongTextInput source="body"/>
    </SimpleForm>
  </Create>
);

export const KeyShow = props => (
  <Show {...props}>
    <SimpleShowLayout>
      <TextField source="title"/>
      <TextField source="teaser"/>
      <RichTextField source="body"/>
      <DateField label="Publication date" source="created_at"/>
    </SimpleShowLayout>
  </Show>
);
