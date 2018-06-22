```json
{
  "tx": {
      // An arbitrary address; mine, in this example
      recipient: "3Jk2fh8aMBmhCQCkBcUfKBSEEa3pDMkDjCr",
      // ID of a token, or WAVES
      assetId: "WAVES",
      // The real amount is the given number divided by 10^(precision of the token)
      amount: 10000000,
      // The same rules for these two fields
      feeAssetId: "WAVES",
      fee: 100000,
      // 140 bytes of data (it"s allowed to use Uint8Array here)
      attachment: "",
      timestamp: 1529537942348
  }
}
```