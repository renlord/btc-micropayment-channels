var bitcoin = require('bitcoinjs-lib');
var assert = require('assert');
var payment_channel = require('../');

var blockcrypt = require('blockcrypt-node');
var token = '8dc121873af8e015a74848d2a604fdc2'

function bcrypt(api) {
  return blockcrypt("btc", "test3", token, api);
}

var clientkey = bitcoin.ECPair.fromWIF('cMtAb5kZR1peExLHZrygMqjJBjBGskMiGS95rCD7iRZJyMUtgjMg', bitcoin.networks.testnet);
var providerkey = bitcoin.ECPair.fromWIF('cRBiLhRrVmci6zFkc6t5xii8E5opgsshtAcp6Xd7i497eLwxHMiC', bitcoin.networks.testnet);

// blocktrail.addressUnspentOutputs(clientkey.getAddress(), function(err, utxos) {
//     console.log(utxos);
//     var commitmentTx = new payment_channel.Commitment({
//         network : bitcoin.networks.testnet,
//         utxos : utxos.data,
//         utxosKeys : [clientkey, clientkey, clientkey],
//         clientKeyPair : clientkey,
//         providerPubKey : providerkey.getPublicKeyBuffer().toString('hex'),
//         changeAddress : 'n3C6KQBdkvUiFJrXwAvAsK1JJqMxKWCBo2',
//         amount : 500,
//         fee : 300
//     });

//     var refundTx = new payment_channel.Refund({
//         network : bitcoin.networks.testnet,
//         fee : 300,
//         amount : 200,
//         multiSigTxValue : commitmentTx.getMultiSigOutputValue(),
//         multiSigTxHash : commitmentTx.tx.getId(),
//         refundAddress : 'n3C6KQBdkvUiFJrXwAvAsK1JJqMxKWCBo2',
//         paymentAddress : 'mmyhgJpSh4TNDvU5gPaSGwNSkVZUZBgpPp',
//         clientMultiSigKey : clientkey,
//         serverPubKey : providerkey.getPublicKeyBuffer().toString('hex')
//     }).tx;
//     console.log('PARTIAL Refund Transaction \n\n');
//     console.log(refundTx);

//     refundTx = payment_channel.Refund.signTx({
//         tx : refundTx,
//         serverMultiSigKey : providerkey,
//         clientPublicKey : clientkey.getPublicKeyBuffer().toString('hex'),
//         network : bitcoin.networks.testnet
//     });

//     console.log('FULL Refund Tx \n\n');
//     console.log(refundTx);

//     var paymentTx = new payment_channel.Payment({
//         network : bitcoin.networks.testnet,
//         fee : 300,
//         amount : 200,
//         sequence : 1,
//         multiSigTxValue : commitmentTx.getMultiSigOutputValue(),
//         multiSigTxHash : commitmentTx.tx.getId(),
//         refundAddress : 'n3C6KQBdkvUiFJrXwAvAsK1JJqMxKWCBo2',
//         paymentAddress : 'mmyhgJpSh4TNDvU5gPaSGwNSkVZUZBgpPp',
//         clientMultiSigKey : clientkey,
//         serverPubKey : providerkey.getPublicKeyBuffer().toString('hex')
//     }).tx;
  
//     console.log('PARTIAL Payment Transaction \n\n');
//     console.log(paymentTx);
//     var hash1 = paymentTx.toHex();

//     paymentTx = payment_channel.Payment.signTx({
//         tx : paymentTx,
//         serverMultiSigKey : providerkey,
//         clientPublicKey : clientkey.getPublicKeyBuffer().toString('hex'),
//         network : bitcoin.networks.testnet
//     });
//     console.log('FULL Payment Transaction \n\n');
//     console.log(paymentTx);
//     var hash2 = paymentTx.toHex();

//     assert.notEqual(hash1, hash2, 'paymentTxs are the same!');
// });

describe('commitTx', function() {
  it('can pay from a wallet to a multisig', function() {
    
  })

  it('can commit an arbitrary amount (ie. less than the max utxos) to the multisig', function() {
    
  })
})

describe('refundTx', function() {
  it('will not be broadcasted before the timelock is due even if you tried', function() {

  })

  it('can be signed by multiple parties seperately', function() {

  })

  it('can be sent from one party to another safely', function() {

  })

  it('will refund the deposit amount less fees', function() {

  })
})

describe('paymentTx', function() {
  it('can be iteratively be updated', function() {

  })

  it('can be signed by multiple parties seperately', function() {

  })

  it('can be broadcasted instantaneously', function() {

  })

  it('can be sent from one party to another safely', function() {

  })

  it('will always spend the maximum allowable deposit amount', function() {

  })
})

describe('consumer', function() {
  it('can dynamically generate a ECPair for MultiSig', function() {

  })

  it('can create a commitTx', function() {

  })

  it('can create a partially signed refundTx', function() {

  })

  it('can create a partially signed paymentTx', function() {

  })
})

describe('producer', function() {
  it('can sign partially signed refundTxs', function() {

  })

  it('can sign partially signed paymentTxs', function() {

  })

  it('consumerPubKey can be set to the producer instance', function() {

  })
})

