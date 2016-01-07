"use strict";

var bitcoin = require('bitcoinjs-lib');

const BTC = 100000000;
const MIN_FEE = 1000;

/**
 * Payment object is used to pay provider
 * This transaction should be created on client side and partially signed on 
 * consumer side as well.
 * 
 * Arguments {}
 * @network [OPTIONAL]
 * @fee [OPTIONAL]
 * @timelock [OPTIONAL]
 * @sequence [OPTIONAL]
 * @amount 
 * @utxos
 * @refundAddress
 * @paymentAddress
 * @clientMultiSigKey
 * @serverPubKey
 */
function Payment(args) {
	this.compulsoryProperties = ['amount', 'utxos', 'refundAddress', 
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

	if (args.locktime) {
		if (args.sequence && (args.sequence > 0)) {
			throw new ParameterError('sequence cannot be greater than zero when there is locktime');
		}

		if (args.locktime < ((new Date).getTime() / 1000)) {
			throw new ParameterError('locktime cannot be before current time');
		}
		txb.tx.locktime = args.locktime;
		args.sequence = 0;
	}	

	if (args.sequence && (args.sequence >= bitcoin.Transaction.DEFAULT_SEQUENCE)) {
		throw new ParameterError('sequence cannot be greater or equal to max sequence');
	}

	var utxosValue = 0;
	var pubKeys = [
		args.clientMultiSigKey.getPublicKeyBuffer(),
		new Buffer(args.serverPubKey, 'hex')
	];
	var redeemScript = bitcoin.script.multisigOutput(2, pubKeys);
	for (var i = 0; i < args.utxos.length; i++) {
		utxosValue += args.utxos[i].amount * BTC;
		txb.addInput(args.utxos[i].txid, args.utxos[i].vout, args.sequence);
		
	}
	utxosValue = Math.round(utxosValue);

	if (utxosValue < (args.amount + args.fee)) {
		throw new ParameterError('insufficient inputs to finance outputs and fees');
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
	var pubKeys = [
		new Buffer(args.clientPublicKey, 'hex'),
		args.serverMultiSigKey.getPublicKeyBuffer()
	];	
	var redeemScript = bitcoin.script.multisigOutput(2, pubKeys);

	for (var i = 0; i < txb.inputs.length; i++) {
		txb.sign(i, args.serverMultiSigKey, redeemScript);
	}
	return txb.build();
}

module.exports = Payment;