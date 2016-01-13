var bitcoin = require('bitcoinjs-lib');
var assert  = require('assert');
var request = require('request');
var async = require('async');
var payment_channel = require('../');

var clientkey = bitcoin.ECPair.fromWIF('cMtAb5kZR1peExLHZrygMqjJBjBGskMiGS95rCD7iRZJyMUtgjMg', bitcoin.networks.testnet);
var providerkey = bitcoin.ECPair.fromWIF('cRBiLhRrVmci6zFkc6t5xii8E5opgsshtAcp6Xd7i497eLwxHMiC', bitcoin.networks.testnet);

const URL = 'https://testnet.blockexplorer.com';
const ADDR = '/api/addr/';
const SEND = '/api/tx/send';
const UTXO = 'utxo';

describe('commitTx', function() {

  it('can pay from a wallet to a multisig', function() {
    async.series([
      function(callback) {
        request
        .get(URL + ADDR + clientkey.getAddress() + "/" + UTXO)
        .on('data', function(chunk) {
          var data = JSON.parse(chunk.toString('utf8'));
          var utxoKeys = [];
          for (var i = 0; i < data.length; i++) {
            utxoKeys.push(clientkey);
          }
          
          commitTx = new payment_channel.Commitment({
            network : bitcoin.networks.testnet,
            utxos : data,
            utxosKeys : utxoKeys,
            clientKeyPair : clientkey,
            providerPubKey : providerkey.getPublicKeyBuffer().toString('hex'),
            changeAddress : 'n3C6KQBdkvUiFJrXwAvAsK1JJqMxKWCBo2',
            amount : 2000,
            fee : 3000
          }).tx;
          callback();
        })
      },
      function(callback) {
        request
        .post({
          url : URL + SEND, 
          form : { rawtx : commitTx.toHex() }
        })
        .on('data', function(chunk) {
          var data = JSON.parse(chunk.toString('utf8'));
          assert.strictEqual(data.hasOwnProperty('txid'), true, 'broadcast was not successful');
          callback();
        })
      }
    ]);
  })
})

describe('paymentTx', function() {

  it('can be iteratively be updated', function() {

    var paymentTx = null;
    var pubkeys = [
      clientkey.getPublicKeyBuffer(),
      providerkey.getPublicKeyBuffer()
    ];
    var redeemScript = bitcoin.script.multisigOutput(2, pubkeys);
    var scriptPubKey = bitcoin.script.scriptHashOutput(bitcoin.crypto.hash160(redeemScript))
    var multiSigAddr = bitcoin.address.fromOutputScript(scriptPubKey, bitcoin.networks.testnet);

    async.series([
      function(callback) {
        request
        .get(URL + ADDR + multiSigAddr + '/' + UTXO)
        .on('data', function(chunk) {
          var data = JSON.parse(chunk.toString('utf8'));
          var paymentCounter = 1;
          var payableAmount = 5000;

          for (var i = 0; i < 10; i++) {
            paymentTx = new payment_channel.Payment({
              network : bitcoin.networks.testnet,
              utxos : data,
              clientMultiSigKey : clientkey,
              serverPubKey : providerkey.getPublicKeyBuffer().toString('hex'),
              paymentAddress : providerkey.getAddress(),
              refundAddress : clientkey.getAddress(),
              sequence : paymentCounter++,
              amount : payableAmount,
              fee : 5000
            }).tx;
            paymentTx = payment_channel.Payment.signTx({
              tx : paymentTx,
              serverMultiSigKey : providerkey,
              clientPublicKey : clientkey.getPublicKeyBuffer()
            });
            payableAmount += 500;
          }
          callback();
        })
      },
      function(callback) {
        request
        .post({
          url : URL + SEND, 
          form : { rawtx : paymentTx.toHex() }
        })
        .on('data', function(chunk) {
          var data = JSON.parse(chunk.toString('utf8'));
          assert.strictEqual(data.hasOwnProperty('txid'), true, 'broadcast was not successful');
        });
      }
    ]);
  })
})

describe('refundTx', function() {
  it('will not be broadcasted before the timelock is due even if you tried', function() {

    var refundTx = null;
    var pubkeys = [
      clientkey.getPublicKeyBuffer(),
      providerkey.getPublicKeyBuffer()
    ];
    var redeemScript = bitcoin.script.multisigOutput(2, pubkeys);
    var scriptPubKey = bitcoin.script.scriptHashOutput(bitcoin.crypto.hash160(redeemScript))
    var multiSigAddr = bitcoin.address.fromOutputScript(scriptPubKey, bitcoin.networks.testnet);

    async.series([
      function(callback) {
        request
        .get(URL + ADDR + multiSigAddr + '/' + UTXO)
        .on('data', function(chunk) {
          var data = JSON.parse(chunk.toString('utf8'));

          refundTx = new payment_channel.Refund({
            network : bitcoin.networks.testnet,
            utxos : data,
            clientMultiSigKey : clientkey,
            serverPubKey : providerkey.getPublicKeyBuffer().toString('hex'),
            paymentAddress : providerkey.getAddress(),
            refundAddress : clientkey.getAddress(),
            amount : 5000,
            fee : 5000
          }).tx;
          callback();
        })
      },
      function(callback) {
        request
        .post({
          url : URL + SEND, 
          form : { rawtx : refundTx.toHex() }
        })
        .on('data', function(chunk) {
          assert.strictEqual(chunk.toString(), 
            'Transaction rejected by network (code -26). Reason: 64: non-final', 
            'it should not broadcast as not final');
          callback();
        })
      },
      function(callback) {
        refundTx = payment_channel.Payment.signTx({
          tx : refundTx,
          serverMultiSigKey : providerkey,
          clientPublicKey : clientkey.getPublicKeyBuffer()
        });
        request
        .post({
          url : URL + SEND, 
          form : { rawtx : refundTx.toHex() }
        })
        .on('data', function(chunk) {
          assert.strictEqual(chunk.toString(), 
            'Transaction rejected by network (code -26). Reason: 64: non-final', 
            'it should not broadcast as not final');
          callback();
        });
      }
    ]);
  })
})

describe('payment channel', function() {
  it('complete the entire payment channel process', function() {
    // we assume that the consumer has the providerPubKey and
    // the provider has the consumerPubKey
    var consumer = null;
    var provider = null;

    var commitTx = null;
    var refundTx = null;
    var paymentTx = null;

    async.series([
      function(callback) {
        // create commitmentTx BUT do not broadcast
        request
        .get(URL + ADDR + clientkey.getAddress() + "/" + UTXO)
        .on('data', function(chunk) {
          var data = JSON.parse(chunk.toString('utf8'));
          console.log(data);
          var utxosKey = [];
          for (var i = 0; i < data.length; i++) {
            utxosKey.push(clientkey);
          }

          consumer = new payment_channel.Consumer({
            consumerKeyPair : clientkey,
            providerPubKey : providerkey.getPublicKeyBuffer(),
            refundAddress : clientkey.getAddress(),
            paymentAddress : providerkey.getAddress(),
            utxos : data,
            utxoKeys : utxosKey,
            depositAmount : 1000000,
            txFee : 5000,
            network : bitcoin.networks.testnet
          });

          provider = new payment_channel.Provider({
            providerKeyPair : providerkey,
            consumerPubKey : clientkey.getPublicKeyBuffer(),
            refundAddress : clientkey.getAddress(),
            paymentAddress : providerkey.getAddress(),
            network : bitcoin.networks.testnet
          });

          consumer.sendCommitmentTx(function(tx) {
            commitTx = tx;
            console.log(commitTx);
          })

          callback();
        })
      },
      function(callback) {
        // create refundTx
        consumer.sendRefundTx(function(tx) {
          refundTx = tx;
          callback();
        })
      },
      function(callback) {
        // server signs the refundTx
        provider.signRefundTx(refundTx);
        provider.sendRefundTx(function(tx) {
          console.log(tx);
          callback();
        })
      },
      function(callback) {
        request
        .post({
          url : URL + SEND, 
          form : { rawtx : commitTx }
        })
        .on('data', function(chunk) {
          var data = JSON.parse(chunk.toString('utf8'));
          console.log(data);
          assert.strictEqual(data.hasOwnProperty('txid'), true, 'broadcast was not successful');
          callback();
        })
      },
      function(callback) {
        // increment payment 1 time and server signs it
        consumer.incrementPayment(1500, function(tx) {
          provider.checkAndSignPaymentTx(tx, 1500);
          callback();
        });
      },
      function(callback) {
        provider.broadcastPaymentTx(function(tx) {
          request
          .post({
            url : URL + SEND, 
            form : { rawtx : tx }
          })
          .on('data', function(chunk) {
            var data = JSON.parse(chunk.toString('utf8'));
            console.log(data);
            assert.strictEqual(data.hasOwnProperty('txid'), true, 'broadcast was not successful');
            callback();
          })
        })
      }
    ]);
  })
})
