# middleware-signing-service

Middleware service for handling signing process

### Installation

Just make ```npm install``` and you are ready to go.

#### About
This module is used for signing transactions / custom payload with provided private keys.


#### How does it work

The signing service acts as a single point for manipulating your private keys, in terms of singing some transaction / custom payload.

In order to start using it, you first need to create your client (please check ```POST /client```).

```
{
    "clientId": "test",
    "clientName": "test client"
}
```

After client creation, you can use the client_id to authorize yourself (all actions will be performed from this client_id).

The next step will be adding some keys (```POST /keys```):

```
[
	    {"key": "employ slice lounge game choose domain token sure palace beach lounge dream", "pubKeys": 10, "default": true},
        {"key": "842ff293a9a31f3bc0fda956c840e89ddb403306d9cc25189b7c3a3685b00f6f"},
        {"key": "employ slice lounge game choose domain token sure palace beach dream lounge", "stage": true}
		]
```

This request will save all 3 keys to local database (sqlite). In our exmaple, the first key in array will be saved alongside with derrived 10 children (technically these children are not stored in dababase, but rather an amount of children, which should be derrived) and will be our default key (in case we won't specify the signer key in sign request - this key will be used by default).

The second key - is a general private key (not extended one).

The thrid key will be saved as staged key. The stage key is useful, when you need to incrementally extract the child and keep only this child.


Now, if we call the ```GET /keys```, we should receive
our saved keys:

```
[
    {
        "address": "0xd78962e703eecef6c8b61b6ce010d21b19363e66",
        "pubKeys": [
            {
                "bch": "0278d2929e8197605616f1637057f06f9121d193a8edd2a8d34f97ef9846a1f2c2",
                "btc": "0278d2929e8197605616f1637057f06f9121d193a8edd2a8d34f97ef9846a1f2c2",
                "eth": "a8107674e086fbc18cbffe4d46ea62a560f7790bf7c25e2a114a41d8c5e1651ee380441887498fa0f95dc97c05e1572b11ccc4ea69ad83fce5f353ad439d4934",
                "ltc": "02ca0423d552bc4d4e6d21e72774f1b96d7d54db0e1329302c944b5b25f3544c73",
                "index": 0
            },
            {
                "bch": "03a7b36f46a21a271ee0b127f30341d98e775266e1c0b67f7b52a8ffebc3b455ca",
                "btc": "03a7b36f46a21a271ee0b127f30341d98e775266e1c0b67f7b52a8ffebc3b455ca",
                "eth": "6df4e20b9297e5e75c71cc6d793e03aab4e7b33179e349e0a7e43d95701ccfe5614f6cc23351dfb7baa0e63ee6b44ffab5e2d9cf5844abc9f6b72a1fa60620d5",
                "ltc": "02316d368dbeac8bfc609fdcb22d7aa8d980dea902a65781e8b014dde8cd6b1b6b",
                "index": 1
            },
            {
                "bch": "029af46eb9dc006965757be27c8930b57a29e6a5f6a37d38761bffa9b36ea9e1f3",
                "btc": "029af46eb9dc006965757be27c8930b57a29e6a5f6a37d38761bffa9b36ea9e1f3",
                "eth": "fb9e29e9e568f00e2b34d7f8082be3c76cf46b0245d4e1f14fa91257dc77fc9398b0e868f45edaf1a5a45a19b9c593bbd345f20d321c4baa8caf42771e56219a",
                "ltc": "03b970805dbfabe8c22ecdd399b8a4549d86afc6e213259748296c793b1bf6e3e8",
                "index": 2
            },
            {
                "bch": "02d8d47ac077b720cba4e6066e0e39ebd7eaaceda6562f268f890d6ad418333419",
                "btc": "02d8d47ac077b720cba4e6066e0e39ebd7eaaceda6562f268f890d6ad418333419",
                "eth": "d3b94db198603fc80f1061e96ab4a2689a6251f1dd66b147d03052c89bec22bd8452121aef23f6d4bb62c08e97401e126b67b8186cc0b11b3c0aa5eec8f71312",
                "ltc": "0218ba3f432830d60c6b57175513e39bc4be8e0b1a49a3e95aa9dfec884be8a80f",
                "index": 3
            },
            {
                "bch": "02cd284eaec14791cdcb8e937bbdb0c36d8b6d2c447dac6f0bd47e2c5aed04fb39",
                "btc": "02cd284eaec14791cdcb8e937bbdb0c36d8b6d2c447dac6f0bd47e2c5aed04fb39",
                "eth": "94ff6bdeee9687e13148ee2f180d535bf47bb6be40f3b27d06bc78dbe0686bd36833c1b5ebc609a5949d659b5f2b3dffd47ba6f043c0a5f92024d7eee536739c",
                "ltc": "03cbd5dc2e7488d71a3d9506ce549d3ab887dc05c9a4383ca8379db33929de5d00",
                "index": 4
            },
            {
                "bch": "02086b27c436a3285a68d4646671f4bd8646f82e01ac9424fa9d0a80f63af99171",
                "btc": "02086b27c436a3285a68d4646671f4bd8646f82e01ac9424fa9d0a80f63af99171",
                "eth": "d0d1b79843b3674066e238f6d9c27ce1d6d1e72130148a08e998ca819f46cc0b131e382e4a2a6559cde8161e90b0513660377a722609a9650c09afab1dca8997",
                "ltc": "020453acdf43a0c33911905f0f01ef6abc2dac24d18b6d73be7965713254e58cdf",
                "index": 5
            },
            {
                "bch": "032fbf319a3f78425bc3da24474574b2e428e44bd93aacd167b8cd2449638d4e8a",
                "btc": "032fbf319a3f78425bc3da24474574b2e428e44bd93aacd167b8cd2449638d4e8a",
                "eth": "b6a51621cc8c9e67d4c52c245191288d06a925a36ae3ad9a8c22a3e84a273337c4526042d81f6d14f3591379425d13735fe49646041d826085098a73e5b4751d",
                "ltc": "0260e03172f8de6fa2424534da7f7042cd19379b1a7ff85162eae4bca82fbb3554",
                "index": 6
            },
            {
                "bch": "03ccde51e000e1fd18bf31eefa9b068d2fb5f3ac4ab94a5c33d7d35295b27f3026",
                "btc": "03ccde51e000e1fd18bf31eefa9b068d2fb5f3ac4ab94a5c33d7d35295b27f3026",
                "eth": "b5264a32e479f86e3a150ea211637023c61eec2caa7932d6ad6babc4fdff0490029be0dbec083fb5e13a8d7160ebd84e17d72f34fa0db28c97f26abb4c861ca6",
                "ltc": "036464393de4784f9c77df65d7fc01b755c2a3dd0a5aa4c292f03a7ce0a1c1568f",
                "index": 7
            },
            {
                "bch": "022bbe9cb273b45db17a835694dd9d7911dc85fb9557e068296d346b4e45759de8",
                "btc": "022bbe9cb273b45db17a835694dd9d7911dc85fb9557e068296d346b4e45759de8",
                "eth": "de696a63f53c6ae1303ac9e85d4d466344705b1147ffe90aa8e353d167d5d6a7b36303856aa51bfabf13fbf1c80d7a08ea6ca2543bddb49af946ce4beecfa220",
                "ltc": "0219ed9da77ac4bbce251651595473f3f2067d254fd5083f160aa32d2ff1f60224",
                "index": 8
            },
            {
                "bch": "0330230048109455b62134b27d6be4aaebb36b37556e59460eb5aadbedb1887c6b",
                "btc": "0330230048109455b62134b27d6be4aaebb36b37556e59460eb5aadbedb1887c6b",
                "eth": "22856864c0fd3759b89199ca7c760913580b7dd6caeafaf9dcd9008220910e5c43cf08f670bea68c2552a723716af7e9ab433f91439e8519c78014414d08e7a5",
                "ltc": "037f7b6334ea36ab0e78d54c0884d49f68c4060c8f7d3c3eab831c52dc70fb647c",
                "index": 9
            }
        ],
        "default": true
    },
    {
        "address": "0xbc026daf98e8f47381d927296f7f543eab3d9138",
        "pubKeys": [
            {
                "bch": "020be55cd8e659810d4c73b9e7df6beb773b4e324c77545d10bcb5da295c8ecfb2",
                "btc": "020be55cd8e659810d4c73b9e7df6beb773b4e324c77545d10bcb5da295c8ecfb2",
                "eth": "0be55cd8e659810d4c73b9e7df6beb773b4e324c77545d10bcb5da295c8ecfb24c23ff70b92f3977b73f28fbb2ff93428e421085f6177204ca7e23f499fcdb9c",
                "ltc": "020be55cd8e659810d4c73b9e7df6beb773b4e324c77545d10bcb5da295c8ecfb2",
                "index": 0
            }
        ],
        "default": false
    },
    {
        "address": "0xea77f5060d21636b9cf1ca7e49aaad4a95eebc38",
        "pubKeys": [
            {
                "bch": "028116dad4bd324b1c0b3f4ac18e35e949023768df44fbb8ef592fb293994c8075",
                "btc": "028116dad4bd324b1c0b3f4ac18e35e949023768df44fbb8ef592fb293994c8075",
                "eth": "45341207ea2211be1557bf510001299c29447c4decf83558e5ac34895d96d142ce450450379bc72731d6f0d4761e1c7b78ad7b87619f45ee5c3f4c97653b7cd7",
                "ltc": "029ef11094e42a8e8179a4c7002a29816c1701b8675e0729763e4817ea52226b90",
                "index": 0
            }
        ],
        "default": false
    }
]
```
As you've pointed out, each key has an address, represented in eth format. By default, this address is extracted from ```hdkey``` and is used in signer service as the key_id, so you could specify by which key you should sign the certain tx, or which key you wish modify / remove.

For instance, we need to derrive not 10, but 5 children from first key, and increment the stage key. The request will look like so ```PUT /keys```

```
[
	{
	"address": "0xd78962e703eecef6c8b61b6ce010d21b19363e66",
	"pubKeys": 5
},
{
	"address": "0xea77f5060d21636b9cf1ca7e49aaad4a95eebc38",
	"incrementChild": 1
}
]
```

and the resut ```GET /keys```

```
[
    {
        "address": "0xd78962e703eecef6c8b61b6ce010d21b19363e66",
        "pubKeys": [
            {
                "bch": "0278d2929e8197605616f1637057f06f9121d193a8edd2a8d34f97ef9846a1f2c2",
                "btc": "0278d2929e8197605616f1637057f06f9121d193a8edd2a8d34f97ef9846a1f2c2",
                "eth": "a8107674e086fbc18cbffe4d46ea62a560f7790bf7c25e2a114a41d8c5e1651ee380441887498fa0f95dc97c05e1572b11ccc4ea69ad83fce5f353ad439d4934",
                "ltc": "02ca0423d552bc4d4e6d21e72774f1b96d7d54db0e1329302c944b5b25f3544c73",
                "index": 0
            },
            {
                "bch": "03a7b36f46a21a271ee0b127f30341d98e775266e1c0b67f7b52a8ffebc3b455ca",
                "btc": "03a7b36f46a21a271ee0b127f30341d98e775266e1c0b67f7b52a8ffebc3b455ca",
                "eth": "6df4e20b9297e5e75c71cc6d793e03aab4e7b33179e349e0a7e43d95701ccfe5614f6cc23351dfb7baa0e63ee6b44ffab5e2d9cf5844abc9f6b72a1fa60620d5",
                "ltc": "02316d368dbeac8bfc609fdcb22d7aa8d980dea902a65781e8b014dde8cd6b1b6b",
                "index": 1
            },
            {
                "bch": "029af46eb9dc006965757be27c8930b57a29e6a5f6a37d38761bffa9b36ea9e1f3",
                "btc": "029af46eb9dc006965757be27c8930b57a29e6a5f6a37d38761bffa9b36ea9e1f3",
                "eth": "fb9e29e9e568f00e2b34d7f8082be3c76cf46b0245d4e1f14fa91257dc77fc9398b0e868f45edaf1a5a45a19b9c593bbd345f20d321c4baa8caf42771e56219a",
                "ltc": "03b970805dbfabe8c22ecdd399b8a4549d86afc6e213259748296c793b1bf6e3e8",
                "index": 2
            },
            {
                "bch": "02d8d47ac077b720cba4e6066e0e39ebd7eaaceda6562f268f890d6ad418333419",
                "btc": "02d8d47ac077b720cba4e6066e0e39ebd7eaaceda6562f268f890d6ad418333419",
                "eth": "d3b94db198603fc80f1061e96ab4a2689a6251f1dd66b147d03052c89bec22bd8452121aef23f6d4bb62c08e97401e126b67b8186cc0b11b3c0aa5eec8f71312",
                "ltc": "0218ba3f432830d60c6b57175513e39bc4be8e0b1a49a3e95aa9dfec884be8a80f",
                "index": 3
            },
            {
                "bch": "02cd284eaec14791cdcb8e937bbdb0c36d8b6d2c447dac6f0bd47e2c5aed04fb39",
                "btc": "02cd284eaec14791cdcb8e937bbdb0c36d8b6d2c447dac6f0bd47e2c5aed04fb39",
                "eth": "94ff6bdeee9687e13148ee2f180d535bf47bb6be40f3b27d06bc78dbe0686bd36833c1b5ebc609a5949d659b5f2b3dffd47ba6f043c0a5f92024d7eee536739c",
                "ltc": "03cbd5dc2e7488d71a3d9506ce549d3ab887dc05c9a4383ca8379db33929de5d00",
                "index": 4
            }
        ],
        "default": true
    },
    {
        "address": "0xbc026daf98e8f47381d927296f7f543eab3d9138",
        "pubKeys": [
            {
                "bch": "020be55cd8e659810d4c73b9e7df6beb773b4e324c77545d10bcb5da295c8ecfb2",
                "btc": "020be55cd8e659810d4c73b9e7df6beb773b4e324c77545d10bcb5da295c8ecfb2",
                "eth": "0be55cd8e659810d4c73b9e7df6beb773b4e324c77545d10bcb5da295c8ecfb24c23ff70b92f3977b73f28fbb2ff93428e421085f6177204ca7e23f499fcdb9c",
                "ltc": "020be55cd8e659810d4c73b9e7df6beb773b4e324c77545d10bcb5da295c8ecfb2",
                "index": 0
            }
        ],
        "default": false
    },
    {
        "address": "0xea77f5060d21636b9cf1ca7e49aaad4a95eebc38",
        "pubKeys": [
            {
                "bch": "02e8e35037edc463d95be187b0d636f0fdc5ffb593d5cce1115541558f3528a95e",
                "btc": "02e8e35037edc463d95be187b0d636f0fdc5ffb593d5cce1115541558f3528a95e",
                "eth": "731149af40eda3eb7517a3c53309fbf7832b37921a83c7b9d6b2757b4fbab228d3fd4b3f81d48e2420301b74185cb52c95ae51d62c5cf3ed6bde577c31b11be5",
                "ltc": "033c59d75af3b8755ea30f9a2dfa16b29d5c29f1e010a9cb908444390719fda907",
                "index": 1
            }
        ],
        "default": false
    }
]
```

And the last operation, which you can perform - is delete. To delete the key, simply call ```DELETE /key```

```
{
	"address": "0x9d1232b2f2d92cf57bc3d13aea01125c341d5c37"
}
```


#### REST endpoints

| type | url | params | headers | output
| ------ | ------ | ------ | ------ | ------ |
| GET | /info | - | - | ``` {"version": "1.0.0", "uptime": "526.683s"}```
| POST | /client | ``` {"clientId": <client_id>,"clientName": <client name>} ``` | - | ``` {"message": "success","status": 1}```
| DELETE | /client | - | ```{client_id: <client_id>}``` | ``` {"message": "success","status": 1}```
| GET | /keys | - | ```{client_id: <client_id>}``` |  ``` [{"address": <key_address>, "pubKeys": [{"bch": <bch_pubkey>, "btc": <btc_pubkey>, "eth": <eth_pubkey>, "ltc": <ltc_pubkey>, "index": <child_index>}...], "default": <is_key_default>}...] ```
| POST | /keys | ``` [{"key": <mnemonic|private_key> (string), "pubKeys": <pubkeys_amount> (number, optional), "default":<use_key_as_default> (bool, optional), "stage": <stage_key>(bool, optional)}}...] ``` | ```{client_id: <client_id>}``` |  ``` {"message": "success", "status": 1}  ```
| DELETE | /keys | ```{address: <key_address> (string) }``` | ```{client_id: <client_id>}``` |  ``` {"message": "success", "status": 1}  ```
| UPDATE | /keys | ```[{address: <key_address> (string),  incrementChild: <increment_stage_child> (bool, optional), stageChild: <stage_key> (bool, optional) }] ``` | ```{client_id: <client_id>}``` |  ``` {"message": "success", "status": 1}  ```

##### сonfigure your .env

To apply your configuration, create a .env file in root folder of repo (in case it's not present already).
Below is the expamle configuration:

```
DB_URI=../db.sqlite
NETWORK=testnet
REST_PORT=8080
```

The options are presented below:

| name | description|
| ------ | ------ |
| DB_URI   | the URI string for connection to local sqlite database (can be absolute or relative)
| NETWORK   | blockchain network (can be testnet, main, regtest)
| REST_PORT   | REST API port

License
----
 [GNU AGPLv3](LICENSE)

Copyright
----
LaborX PTY