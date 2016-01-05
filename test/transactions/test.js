var bitcoin = require('bitcoinjs-lib');
var assert = require('assert');
var payment_channel = require('../../');
var blocktrail          = require('blocktrail-sdk').BlocktrailSDK({
        apiKey : '6d740cd142f3fca5a75173ee07e3c60214bbc566',
        apiSecret : '2a66e3a2aba3ec37939d747cbae577994811bef3',
        network : 'BTC',
        testnet : true
});


var clientkey = bitcoin.ECPair.fromWIF('cMtAb5kZR1peExLHZrygMqjJBjBGskMiGS95rCD7iRZJyMUtgjMg', bitcoin.networks.testnet);
var providerkey = bitcoin.ECPair.fromWIF('cRBiLhRrVmci6zFkc6t5xii8E5opgsshtAcp6Xd7i497eLwxHMiC', bitcoin.networks.testnet);

blocktrail.addressUnspentOutputs(clientkey.getAddress(), function(err, utxos) {
    console.log(utxos);
    var commitmentTx = new payment_channel.Commitment({
        network : bitcoin.networks.testnet,
        utxos : utxos.data,
        utxosKeys : [clientkey, clientkey, clientkey],
        clientKeyPair : clientkey,
        providerPubKey : providerkey.getPublicKeyBuffer().toString('hex'),
        changeAddress : 'n3C6KQBdkvUiFJrXwAvAsK1JJqMxKWCBo2',
        amount : 500,
        fee : 300
    });
    console.log(commitmentTx.tx.toHex());
    console.log(commitmentTx.tx.getId());

    var paymentTx = new payment_channel.Payment({
        network : bitcoin.networks.testnet,
        fee : 300,
        amount : 200,
        multiSigTxValue : commitmentTx.getMultiSigOutputValue(),
        multiSigTxHash : commitmentTx.tx.getId(),
        refundAddress : 'n3C6KQBdkvUiFJrXwAvAsK1JJqMxKWCBo2',
        paymentAddress : 'mmyhgJpSh4TNDvU5gPaSGwNSkVZUZBgpPp',
        clientMultiSigKey : clientkey,
        serverPubKey : providerkey.getPublicKeyBuffer().toString('hex')
    }).tx;
    console.log('PARTIAL Payment Transaction \n\n');
    console.log(paymentTx);
    paymentTx = payment_channel.Payment.signTx({
        tx : paymentTx,
        serverMultiSigKey : providerkey,
        clientPublicKey : clientkey.getPublicKeyBuffer().toString('hex'),
        network : bitcoin.networks.testnet
    });
    console.log('FULL Payment Transaction \n\n');
    console.log(paymentTx);
});

