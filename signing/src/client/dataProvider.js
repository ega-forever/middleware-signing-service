import {
  fetchUtils,
  GET_LIST,
  GET_ONE,
  GET_MANY,
  GET_MANY_REFERENCE,
  CREATE,
  UPDATE,
  UPDATE_MANY,
  DELETE,
  DELETE_MANY,
} from 'react-admin';

import _ from 'lodash';

const accountList = [ //todo replace with rest call
  {id: '0x1222', address: '0x1222'},
  {id: '0x1223', address: '0x1223'},
  {id: '0x1224', address: '0x1224'},
  {id: '0x1225', address: '0x1225'},
  {id: '0x1226', address: '0x1226'},
  {id: '0x1227', address: '0x1227'}
];

const keysList = [ //todo replace with rest call
  {
    id: '0x45345',
    key: '0x124342',
    master: true
  },
  {
    id: '0x453452',
    key: '0x342312',
    master_key_address: '0x45345'
  },
  {
    id: '0x3423',
    key: '0x632312',
    master_key_address: '0x45345'
  }
];


const keyInAccountsRelation = [
  {id: 1, key_address: '0x45345', addresses: [accountList[0].address]},
  {id: 2, key_address: '0x453452', addresses: [accountList[1].address, accountList[2].address]},
  {id: 3, key_address: '0x3423', addresses: [accountList[1].address]}
];

const getKeysQuery = (query = {})=>{

  return _.filter(keyInAccountsRelation, query).map(relation=>{

    const masterKey = _.find(keysList, {id: relation.key_address});
    let children = [];

    if(masterKey.master){
      let keys = _.filter(keysList, {master_key_address: masterKey.id});
      children = keys.map(key=>{
        const relation = _.find(keyInAccountsRelation, {key_address: key.id});
        return {
          address: key.id,
          key: key.key,
          master_key_address: masterKey.id,
          owners: relation.addresses.map(address=>({address})),
          isMaster: false,
          children: []
        };
      });
    }

    return {
      id: relation.id,
      address: masterKey.id,
      key: masterKey.key,
      owners: relation.addresses.map(address=>({address})),
      isMaster: !!masterKey.master,
      children: children
    };
  });

};

/**
 * Query a data provider and return a promise for a response
 *
 * @example
 * dataProvider(GET_ONE, 'posts', { id: 123 })
 *  => Promise.resolve({ data: { id: 123, title: "hello, world" } })
 *
 * @param {string} type Request type, e.g GET_LIST
 * @param {string} resource Resource name, e.g. "posts"
 * @param {Object} payload Request parameters. Depends on the action type
 * @returns {Promise} the Promise for a response
 */
const dataProvider = (type, resource, params) => {

  console.log(type, resource, params);

  if(resource === 'accounts' && type === GET_LIST)
    return Promise.resolve({data: accountList, total: accountList.length});

  if(resource === 'accounts' && type === GET_ONE) {
   let account = _.find(accountList, {address: params.id});
    return Promise.resolve({data: account});
  }


  if(resource === 'keys' && type === GET_LIST){
    let list = getKeysQuery();
    return Promise.resolve({data: list, total: list.length});
  }



  if(resource === 'keys' && type === GET_ONE) {
    let list = getKeysQuery({id: parseInt(params.id)});
    return Promise.resolve({data: list[0]});
  }

  if(resource === 'keys' && type === GET_MANY_REFERENCE) {
    let list = getKeysQuery({id: parseInt(params.id)});
    return Promise.resolve({data: list, total: list.length});
  }

};

export default dataProvider;
