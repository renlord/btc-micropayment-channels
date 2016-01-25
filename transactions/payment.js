"use strict";

const bitcoin   = require('bitcoinjs-lib')
const script    = require('../script')

const BTC       = 100000000
const MIN_FEE   = 1000

/**
 * Payment object is used to pay provider
 * This transaction should be created on client side and partially signed on 
 * consumer side as well.
 * 
 * Arguments {}
 * @network [OPTIONAL]
 * @fee [OPTIONAL]
 * @timelock
 * @amount 
 * @utxos
 * @refundAddress
 * @paymentAddress
 * @clientMultiSigKey
 * @serverPubKey
 */
function Payment(args) {
	this.compulsoryProperties = ['amount', 'utxos', 'refundAddress', 'timelock',
		'paymentAddress', 'clientMultiSigKey', 'serverPubKey'
	];

	this.compulsoryProperties.forEach(function(p) {
		if (!args.hasOwnProperty(p)) {
			throw new Error('Compulsory property omitted : \"' + p + '\"');
		}
	});

	if (args.network) {
		var txb = new bitcoin.TransactionBuilder(args.network)
	} else {
		var txb = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);
	}

	var fee = args.fee ? args.fee : MIN_FEE;

	if (args.fee < MIN_FEE) {
		throw new Error('fee cannot be less than 300 Satoshis');
	}

	if (args.amount + fee > args.multiSigTxValue) {
		throw new Error('insufficient input value to cover for output value');
	}

	var utxosValue = 0;

    var redeemScript = script.fundingSharedOutputScriptHash({
        providerPubKey: new Buffer(args.serverPubKey, 'hex'),
        consumerPubKey: args.clientMultiSigKey.getPublicKeyBuffer(),
        timelock: args.timelock
    })
    var p2sh = bitcoin.script.scriptHashOutput(bitcoin.crypto.hash160(redeemScript))

	for (var i = 0; i < args.utxos.length; i++) {
        console.log(args.utxos[i])
		utxosValue += (args.utxos[i].amount * BTC)
		txb.addInput(args.utxos[i].txid, args.utxos[i].vout, 
                bitcoin.Transaction.DEFAULT_SEQUENCE, p2sh)
	}

    utxosValue = Math.round(utxosValue)

	if (utxosValue < (args.amount + args.fee)) {
		throw new Error('insufficient inputs to finance outputs and fees');
	}

	txb.addOutput(args.paymentAddress, args.amount);
	if ((utxosValue - args.amount - args.fee) > 0) {
		txb.addOutput(args.refundAddress, utxosValue - args.amount - args.fee);
	}

	for (var i = 0; i < args.utxos.length; i++) {
		txb.sign(i, args.clientMultiSigKey, redeemScript);
	}

	this.tx = txb.buildIncomplete();
}

/**
 * For the server to sign the Payment Transaction.
 * ARGUMENTS {} Object
 * @tx
 * @serverMultiSigKey
 * @clientPublicKey
 * @network [OPTIONAL]
 */
Payment.signTx = function(args) {
	var compulsoryProperties = ['tx', 'serverMultiSigKey', 'clientPublicKey'];

	compulsoryProperties.forEach(function(p) {
		if (!args.hasOwnProperty(p)) {
			throw new ParameterError('Compulsory property omitted : \"' + p + '\"');
		}
	})

	if (!args.serverMultiSigKey instanceof bitcoin.ECPair) {
		throw new TypeError('args.serverMultiSigKey should be type ECPair');
	}

	if (!args.tx instanceof bitcoin.Transaction) {
		throw new TypeError('args.tx should be type bitcoin.Transaction');
	}

	var network = args.network ? args.network : bitcoin.networks.testnet;

	var txb = bitcoin.TransactionBuilder.fromTransaction(args.tx, network);

    var redeemScript = script.fundingSharedOutputScriptHash({
        consumerPubKey: args.clientMultiSigKey.getPublicKeyBuffer(),
        providerPubKey: serverPubKey,
        timelock: args.timelock
    })

	for (var i = 0; i < txb.inputs.length; i++) {
		txb.sign(i, args.serverMultiSigKey, redeemScript);
	}
	return txb.build();
}

module.exports = Payment;
