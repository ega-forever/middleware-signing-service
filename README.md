# middleware-signing-service

Middleware service for handling signing process

### Installation

Just make ```npm install``` and you are ready to go.

#### About
This module is used for signing transactions / custom payload with provided private keys.


#### How does it work

The signing service acts as a single point for manipulating your private keys, in terms of singing some transaction / custom payload.

In order to start using it, you first need to install [auth-service](https://gitlab.chronobank.io/chronobank/middleware-auth-service.git).

After rolling out the auth service, you need to set up your config file:

(.env example)
```
AUTH_SERVICE_ID=middleware_signing_service
AUTH_PROVIDER_URI=http://localhost:8082
```

After rolling out the auth-service, you are now able to send authorized requests to signing service.

Now, let's vreate the user, from which we can run our requests, and create the token for him:

```
const lib = require('middleware_auth_lib'),
    serviceId = 'middleware_signing_service',
    tokenLib = new lib.Token({
        id: 'middleware_signing_service',
        provider: 'http://localhost:8082',
        secret: '123'
    });

const account = web3.eth.accounts.create();
const userId = account.address.toString();
const scopes = [config.auth.serviceId];

const token = await tokenLib.getUserToken(userId, scopes);
```

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

The result of the call - will be the same, as in ```GET /keys```, but array of keys will include only created keys:
```
[
    {
        "address": "0xd78962e703eecef6c8b61b6ce010d21b19363e66",
        "rootPubKey": "xpub661MyMwAqRbcG8rV3k7wbPvgg8dm8pVqeYCM2QboXhu4pqfwHowq7fU5e1vgp3sZ5r7wiGHdgy19615UPVyrDpPRfB3zAofioqSPsvt4x8r",
        "pubKeys": [
            {
                "index": 0,
                "bch": "02f29e9aad7da4cd9a1adee9d3c661a41446d9a8648d8780d5e971634e2f439c3a",
                "btc": "02f29e9aad7da4cd9a1adee9d3c661a41446d9a8648d8780d5e971634e2f439c3a",
                "eth": "a8107674e086fbc18cbffe4d46ea62a560f7790bf7c25e2a114a41d8c5e1651ee380441887498fa0f95dc97c05e1572b11ccc4ea69ad83fce5f353ad439d4934",
                "ltc": "02f29e9aad7da4cd9a1adee9d3c661a41446d9a8648d8780d5e971634e2f439c3a",
                "nem": "c0c787fc90773945c50d5625c03a583aa347bd240a5e5b474ffc8f0cf1c4506a",
                "waves": "De5bjhPHEuem9g5fZnF6H7ZzWfnFNHL6NduT91QVAckj"
            },
            {
                "index": 1,
                "bch": "03a2ae3308cba320da54d86ffda4795d6b0f8ae44317064cfd48fb1422c606fc51",
                "btc": "03a2ae3308cba320da54d86ffda4795d6b0f8ae44317064cfd48fb1422c606fc51",
                "eth": "6df4e20b9297e5e75c71cc6d793e03aab4e7b33179e349e0a7e43d95701ccfe5614f6cc23351dfb7baa0e63ee6b44ffab5e2d9cf5844abc9f6b72a1fa60620d5",
                "ltc": "03a2ae3308cba320da54d86ffda4795d6b0f8ae44317064cfd48fb1422c606fc51",
                "nem": "9221e9c9c835bd4946ab56f004b10f4c1e1447948c49e59963efb37501f84be4",
                "waves": "A3fzS8Hjrwxb9pb87YqQFed5mpK6Lv7zjQX6DPcRznYL"
            },
            {
                "index": 2,
                "bch": "03d9cfd5c90fd8f9d75e90f08d154ac949c460a67889a3363c47895a711b9ee5fd",
                "btc": "03d9cfd5c90fd8f9d75e90f08d154ac949c460a67889a3363c47895a711b9ee5fd",
                "eth": "fb9e29e9e568f00e2b34d7f8082be3c76cf46b0245d4e1f14fa91257dc77fc9398b0e868f45edaf1a5a45a19b9c593bbd345f20d321c4baa8caf42771e56219a",
                "ltc": "03d9cfd5c90fd8f9d75e90f08d154ac949c460a67889a3363c47895a711b9ee5fd",
                "nem": "b6ac6c0c44d4e09ac32834d437c50371dc8d6bd127170ed5c2d3f587bd8830e4",
                "waves": "2coAoi3sT5LuYqepDjFFRxJtP59jVEe5HUttypQTFknZ"
            },
            {
                "index": 3,
                "bch": "02d5cb11434352e43c6905f53cf2e24b9ec498753052e20198b4123bcea8ce16d5",
                "btc": "02d5cb11434352e43c6905f53cf2e24b9ec498753052e20198b4123bcea8ce16d5",
                "eth": "d3b94db198603fc80f1061e96ab4a2689a6251f1dd66b147d03052c89bec22bd8452121aef23f6d4bb62c08e97401e126b67b8186cc0b11b3c0aa5eec8f71312",
                "ltc": "02d5cb11434352e43c6905f53cf2e24b9ec498753052e20198b4123bcea8ce16d5",
                "nem": "b63007e7ebf7f8734332f3634ef8a7d5bd8dd77df30567f638d06708ffcc9efe",
                "waves": "ETQCsSZPdBvNP6ESHTrVKQ4shaXwXJqozb7pT21cLkb9"
            },
            {
                "index": 4,
                "bch": "029c6769317ad7bbc75b9fc759a98c07d6990afa845158e13fdb2c90db7d172972",
                "btc": "029c6769317ad7bbc75b9fc759a98c07d6990afa845158e13fdb2c90db7d172972",
                "eth": "94ff6bdeee9687e13148ee2f180d535bf47bb6be40f3b27d06bc78dbe0686bd36833c1b5ebc609a5949d659b5f2b3dffd47ba6f043c0a5f92024d7eee536739c",
                "ltc": "029c6769317ad7bbc75b9fc759a98c07d6990afa845158e13fdb2c90db7d172972",
                "nem": "161c30b20a18df35a6d334a286d16b80a3ec7cbeb699b1034d469c902e432e1a",
                "waves": "vHiB2HFjr4KAD6z7oqiEaTuF8H6rTpBDwREj1Ghc7vL"
            },
            {
                "index": 5,
                "bch": "033cbb481b817ef1be8f9644005acfa16ab8060dd07c43040b1f562f2ad5890b38",
                "btc": "033cbb481b817ef1be8f9644005acfa16ab8060dd07c43040b1f562f2ad5890b38",
                "eth": "d0d1b79843b3674066e238f6d9c27ce1d6d1e72130148a08e998ca819f46cc0b131e382e4a2a6559cde8161e90b0513660377a722609a9650c09afab1dca8997",
                "ltc": "033cbb481b817ef1be8f9644005acfa16ab8060dd07c43040b1f562f2ad5890b38",
                "nem": "9cdacddb1a9352c9b58cd9262b01109336d63cfbf49b8754c15ed04419fe4c78",
                "waves": "BwUz8dZnLBeiAhHmRrdGU6kZSCQe7CYy4vnoRFKKSRgF"
            },
            {
                "index": 6,
                "bch": "02798200b9d172021f95c760996af5326ff84397cacfe8a2bf335c46656d00667d",
                "btc": "02798200b9d172021f95c760996af5326ff84397cacfe8a2bf335c46656d00667d",
                "eth": "b6a51621cc8c9e67d4c52c245191288d06a925a36ae3ad9a8c22a3e84a273337c4526042d81f6d14f3591379425d13735fe49646041d826085098a73e5b4751d",
                "ltc": "02798200b9d172021f95c760996af5326ff84397cacfe8a2bf335c46656d00667d",
                "nem": "b3c12545ec8373891ea29416afbb22e88c6127bc9c9bd1093c5fbfd96d119cfb",
                "waves": "AZkdrUDn21YfN7p3v5YWyfYiTmEud2UoAU7JqGAbaggL"
            },
            {
                "index": 7,
                "bch": "03e6fee1399b1b82edc99d3ed3ca358e2d997faf6a9fd63ea0d9f2fab92dbc3210",
                "btc": "03e6fee1399b1b82edc99d3ed3ca358e2d997faf6a9fd63ea0d9f2fab92dbc3210",
                "eth": "b5264a32e479f86e3a150ea211637023c61eec2caa7932d6ad6babc4fdff0490029be0dbec083fb5e13a8d7160ebd84e17d72f34fa0db28c97f26abb4c861ca6",
                "ltc": "03e6fee1399b1b82edc99d3ed3ca358e2d997faf6a9fd63ea0d9f2fab92dbc3210",
                "nem": "24412d0c49af09b23c716c33bdd574d7c16efa2d517049db7a3f84e8f5c0e941",
                "waves": "FvvSzcW6eirWx9vxj9sFCakTJPBQyo4u4kXy36njzTMf"
            },
            {
                "index": 8,
                "bch": "034a05207497d843bc49eaf2a42b78d93cffc8ce4038cb3e618d92c502bc712cb9",
                "btc": "034a05207497d843bc49eaf2a42b78d93cffc8ce4038cb3e618d92c502bc712cb9",
                "eth": "de696a63f53c6ae1303ac9e85d4d466344705b1147ffe90aa8e353d167d5d6a7b36303856aa51bfabf13fbf1c80d7a08ea6ca2543bddb49af946ce4beecfa220",
                "ltc": "034a05207497d843bc49eaf2a42b78d93cffc8ce4038cb3e618d92c502bc712cb9",
                "nem": "df39c6e6ad7da5655c6322ce56a64686a0eff6ae5c1bbbf1e5f7ca37b7399237",
                "waves": "6qcBE7Kg7z8aM7M4NvJ7LFcbdCcjfacyLZnqMPSWQ9nw"
            },
            {
                "index": 9,
                "bch": "02dffefb02fea886e37c41c0faba550485dc754ed857e6e74c394c4c6db8274ba4",
                "btc": "02dffefb02fea886e37c41c0faba550485dc754ed857e6e74c394c4c6db8274ba4",
                "eth": "22856864c0fd3759b89199ca7c760913580b7dd6caeafaf9dcd9008220910e5c43cf08f670bea68c2552a723716af7e9ab433f91439e8519c78014414d08e7a5",
                "ltc": "02dffefb02fea886e37c41c0faba550485dc754ed857e6e74c394c4c6db8274ba4",
                "nem": "ab0b488acf69b7d3fb0bdb83160d88c151af1af1f198192ecc403f6fd210fc95",
                "waves": "2dRPKtPN99oopzi8nqHATyfeuEMhQqvWnPtiZzcUWP3h"
            }
        ],
        "default": true,
        "shared": false,
        "info": "",
        "virtual": false
    },
    {
        "address": "0xbc026daf98e8f47381d927296f7f543eab3d9138",
        "rootPubKey": "0be55cd8e659810d4c73b9e7df6beb773b4e324c77545d10bcb5da295c8ecfb24c23ff70b92f3977b73f28fbb2ff93428e421085f6177204ca7e23f499fcdb9c",
        "pubKeys": [
            {
                "index": 0,
                "bch": "020be55cd8e659810d4c73b9e7df6beb773b4e324c77545d10bcb5da295c8ecfb2",
                "btc": "020be55cd8e659810d4c73b9e7df6beb773b4e324c77545d10bcb5da295c8ecfb2",
                "eth": "0be55cd8e659810d4c73b9e7df6beb773b4e324c77545d10bcb5da295c8ecfb24c23ff70b92f3977b73f28fbb2ff93428e421085f6177204ca7e23f499fcdb9c",
                "ltc": "020be55cd8e659810d4c73b9e7df6beb773b4e324c77545d10bcb5da295c8ecfb2",
                "nem": "e081f76ed4855e519f8a970103b75f464829f6db3c1d928c61e4f931ee1ce565",
                "waves": "HZcyWjUKbR5UET8aSyxmYWWGTeWH335nEZpqQZfvR2ey"
            }
        ],
        "default": false,
        "shared": false,
        "info": "",
        "virtual": false
    },
    {
        "address": "0xea77f5060d21636b9cf1ca7e49aaad4a95eebc38",
        "rootPubKey": "xpub661MyMwAqRbcEkm5B24Tg5ttsebFHAMULEgpzbwjPENRNCCj8q4x1DCPp8WdajFbEfqNCVVhRY9zHmAhAgWqELPGJf6wDpYnpaEisbyNFfa",
        "pubKeys": [
            {
                "index": 0,
                "bch": "026c376fad2385e1bb9ef44eb8d982ac5d842d1de5a406be82568a5532a981e6af",
                "btc": "026c376fad2385e1bb9ef44eb8d982ac5d842d1de5a406be82568a5532a981e6af",
                "eth": "45341207ea2211be1557bf510001299c29447c4decf83558e5ac34895d96d142ce450450379bc72731d6f0d4761e1c7b78ad7b87619f45ee5c3f4c97653b7cd7",
                "ltc": "026c376fad2385e1bb9ef44eb8d982ac5d842d1de5a406be82568a5532a981e6af",
                "nem": "4c3444d0e6a31cf819cb2d0c43577d515d8446049a90dc2aff739bbcc1067afe",
                "waves": "3HkThpNsHeCGS5xJ77MmRwpyS2LoGGGZqFL3iNDNJQ4w"
            }
        ],
        "default": false,
        "shared": false,
        "info": "",
        "virtual": false
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

### Sign txs and custom data
After keys are being created, now we can use them for signing process. To do so, you need to make a call to ```POST /tx/<blockchain_type> ``` in order to sign the tx for the specified blockchain. The generic form of request looks like so:
```
{
	"signers": ["0xc81e9abc39898e01abf0de83d0d88b024f0da1fc"],
	"payload": <raw_tx>,
	"options": <sign_options>
}
```

where signers - is an array of root key addresses, or public keys.

#### Ethereum
In case of ethereum, the payload should look like:
```
{
	"signers": ["a8107674e086fbc18cbffe4d46ea62a560f7790bf7c25e2a114a41d8c5e1651ee380441887498fa0f95dc97c05e1572b11ccc4ea69ad83fce5f353ad439d4934"],
	"payload": {
		"nonce": "0x00",
		"gasPrice": "0x09184e72a000",
		"gasLimit": "0x2710",
		"to": "0x0000000000000000000000000000000000000000",
		"value": "0x00",
		"data": "0x7f7465737432000000000000000000000000000000000000000000000000000000600057"
	}
}
```

here, the payload - is raw ethereum transaction, and signer - is the derived child from one of created keys earlier.
The response for this request should look like this:
```
{
    "rawTx": {
        "messageHash": "0x30e04d65e63867be7a41b0ad04c93686ecdfb595f7ed35797dc8a70fcce8eb9c",
        "r": "0xc6e6fdc7ee8663f227f832a668ed4c73b0e7b04c9101594111baf7182902baf6",
        "s": "0x682fb76dbd30a61db9e54a5b1871a10b36e1c84a754a39d61e70ef0d79e1a8d7",
        "v": "0x1c",
        "rawTransaction": "0xf889808609184e72a00082271094000000000000000000000000000000000000000080a47f74657374320000000000000000000000000000000000000000000000000000006000571ca0c6e6fdc7ee8663f227f832a668ed4c73b0e7b04c9101594111baf7182902baf6a0682fb76dbd30a61db9e54a5b1871a10b36e1c84a754a39d61e70ef0d79e1a8d7"
    }
}
```


#### Bitcoin / Litecoin / Bitcoin Cash
In case of bitcoin, the payload should look like:
```
{
	"singers": ["a8107674e086fbc18cbffe4d46ea62a560f7790bf7c25e2a114a41d8c5e1651ee380441887498fa0f95dc97c05e1572b11ccc4ea69ad83fce5f353ad439d4934"],
	"payload": {
        "incompleteTx": "0100000001375bf626600dc45539503c0f3f6aef9d7d282ef0b294a212bb78e9409b84119f0000000000ffffffff01e8030000000000001976a914734f778e0072b8722ada2db2db495dd5b3faccc988ac00000000"
	}
}
```

here, the payload - is raw bitcoin transaction (obtained from [bitcoinjs-lib](https://www.npmjs.com/package/bitcoinjs-lib)), and signer - is the derived child from one of created keys earlier.
The response for this request should look like this:
```
{
    "rawTx": "0100000001375bf626600dc45539503c0f3f6aef9d7d282ef0b294a212bb78e9409b84119f000000006b483045022100bfd4589b278f8c7eb059886f6fd2b36ed5fa35b58c56a10d1879def7f4eee4b4022007fa7db99a9c7d7b55825fd62967c2196e596539b7678d0e2ff7b80a5cfc79e8012102f29e9aad7da4cd9a1adee9d3c661a41446d9a8648d8780d5e971634e2f439c3affffffff01e8030000000000001976a914734f778e0072b8722ada2db2db495dd5b3faccc988ac00000000"
}
```


Also, it's possible to create mutisig transactions:
```
{
	"signers": ["a8107674e086fbc18cbffe4d46ea62a560f7790bf7c25e2a114a41d8c5e1651ee380441887498fa0f95dc97c05e1572b11ccc4ea69ad83fce5f353ad439d4934"],
	"payload": {
"redeemScript": "522102ebc042c42cce75ae70c2aee79fd7f746a6b0954ea5a404b74f0d8983e0dc480e21038c654d8ed0cbbd14165f8916a62d8b406f7f12c2cddb4544d869a5a4b9b3158352ae",
  "incompleteTx": "0100000001375bf626600dc45539503c0f3f6aef9d7d282ef0b294a212bb78e9409b84119f0000000000ffffffff01e8030000000000001976a914734f778e0072b8722ada2db2db495dd5b3faccc988ac00000000"
	}
}
```

### Share keys
There may be a case, when you want to give some other client the permission to sign the transaction from your provite key.
For this purpose, it's allowed to share the key (root key or certain children) with other client. To do that, simply call the ```PUT /keys``` with the following params:
```
[
    {
	    "address": "0xd78962e703eecef6c8b61b6ce010d21b19363e66",
	    "share": true,
	    "clientId": "super_client_id",
	    "children": [1]
    }
]
```

According to this case, we are going to share with "super_client_id" the key with root address "0xd78962e703eecef6c8b61b6ce010d21b19363e66" and give him the permission to use the 1 derived child of that key for siging.

In case you wish to share the root key (and all derived children as well), then you can just comment the children field.


### Virtual keys

Sometimes, you may wish to build the composite keys, for instance, for signing multisig transactions. For this case, you can create the virtual key. The virtual key is created for specific blockchain only!

In order to use it, you first need to create it by calling ```POST /keys/virtual```:
```

{
	"multisig": true,
	"required": 2,
	"blockchain": "btc",
	"keys": [
			{"address": "0xd78962e703eecef6c8b61b6ce010d21b19363e66", "index": 0},
			{"address": "0xbc026daf98e8f47381d927296f7f543eab3d9138", "index": 0}
		]
}
```
here, we are going to create the multisig key from 0 derived chidlren from addresses "0xd78962e703eecef6c8b61b6ce010d21b19363e66" and "0xbc026daf98e8f47381d927296f7f543eab3d9138" for bitcoin blockchain, and
state, that this for signing with this address, we require 2 signatures.

The result of the request will look like so:
```
[
    {
        "address": "2N4mN3fQ8siUTrgsC4ps1mMwMaRVhUn2bxB",
        "pubKeys": [
            {
                "btc": "02f29e9aad7da4cd9a1adee9d3c661a41446d9a8648d8780d5e971634e2f439c3a",
                "index": 0
            },
            {
                "btc": "020be55cd8e659810d4c73b9e7df6beb773b4e324c77545d10bcb5da295c8ecfb2",
                "index": 0
            }
        ],
        "default": false,
        "shared": false,
        "info": "",
        "virtual": true,
        "required": 2
    }
]
```


#### REST endpoints

| type | url | params | headers | output
| ------ | ------ | ------ | ------ | ------ |
| GET | /info | - | - | ``` {"version": "1.0.0", "uptime": "526.683s"}```
| GET | /keys | - | ```{authorization:Bearer <token>}``` |  ``` [{"address": <key_address>, "rootPubKey": <root_public_key>, pubKeys": [{"bch": <bch_pubkey>, "btc": <btc_pubkey>, "eth": <eth_pubkey>, "ltc": <ltc_pubkey>, "index": <child_index>}...], "default": <is_key_default>}...] ```
| POST | /keys | ``` [{"key": <mnemonic|private_key> (string), "pubKeys": <pubkeys_amount> (number, optional), "default":<use_key_as_default> (bool, optional), "stage": <stage_key>(bool, optional)}}...] ``` | ```{authorization:Bearer <token>}``` |  ``` [{"address": <key_address>, "rootPubKey": <root_public_key>, pubKeys": [{"bch": <bch_pubkey>, "btc": <btc_pubkey>, "eth": <eth_pubkey>, "ltc": <ltc_pubkey>, "index": <child_index>}...], "default": <is_key_default>}...] ```
| POST | /keys/generate | ``` [{"pubKeys": <pubkeys_amount> (number, optional), "default":<use_key_as_default> (bool, optional), "stage": <stage_key>(bool, optional)}}...] ``` | ```{authorization:Bearer <token>}``` |  ``` [{"address": <key_address>, "rootPubKey": <root_public_key>, pubKeys": [{"bch": <bch_pubkey>, "btc": <btc_pubkey>, "eth": <eth_pubkey>, "ltc": <ltc_pubkey>, "index": <child_index>}...], "default": <is_key_default>}...] ```
| DELETE | /keys | ```{address: <key_address> (string) }``` | ```{authorization:Bearer <token>}``` |  ``` {"message": "success", "status": 1}  ```
| PUT | /keys | ```[{address: <key_address> (string),  incrementChild: <increment_stage_child> (bool, optional), stageChild: <stage_key> (bool, optional) }] ``` | ```{authorization:Bearer <token>}``` |  ``` {"message": "success", "status": 1}  ```
| POST | /keys/virtual | ```[{multisig: <is_key_for_multisig> (bool),  required: <required_amount_for_sign> (number), blockchain: <blockchain_type> (string), keys: [address: <key_base_address> (string), index: <index_of_pub_key> (number)] }] ``` | ```{authorization:Bearer <token>}``` |  ``` [{"address": <key_address>, "rootPubKey": <root_public_key>, pubKeys": [{<blockchain_type>: <blockchain_type_pubkey> "index": <child_index>}...], "default": <is_key_default>, "shared: <is_key_shared>, info: <key_info>, virtual: <is_key_virtual>, required: <required_amount_for_sign>}...] ```
| PUT | /keys/virtual | ```[{address: <key_address> (string),  share: <share_key> (bool), client_id: <client_id_with_whom_share_key> (string) }] ``` | ```{authorization:Bearer <token>}``` |  ``` {"message": "success", "status": 1}  ```
| DELETE | /keys/virtual | ```{address: <key_address> (string) }``` | ```{authorization:Bearer <token>}``` |  ``` {"message": "success", "status": 1}  ```

| POST | /tx/<blockchain_type> | ```{signers: [<key_address|pub_key> (string)], payload: <raw_tx> (object), options: <sign_options>(object)  }``` | ```{authorization:Bearer <token>}``` |  ``` {"rawTx": <raw_tx>(object|string)}  ```

##### сonfigure your .env

To apply your configuration, create a .env file in root folder of repo (in case it's not present already).
Below is the expamle configuration:

```
DB_URI=../db.sqlite
NETWORK=testnet
AUTH_SERVICE_ID=middleware_signing_service
AUTH_PROVIDER_URI=http://localhost:8082
REST_PORT=8080
```

The options are presented below:

| name | description|
| ------ | ------ |
| DB_URI   | the URI string for connection to local sqlite database (can be absolute or relative)
| NETWORK   | blockchain network (can be testnet, main, regtest)
| REST_PORT   | REST API port
| AUTH_SERVICE_ID | the auth service id
| AUTH_PROVIDER_URI | the auth server url
License
----
 [GNU AGPLv3](LICENSE)

Copyright
----
LaborX PTY