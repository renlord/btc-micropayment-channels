"use strict";

var bitcoin = require('bitcoinjs-lib');

const BIT 		= 100; 
const SATOSHI = 1;

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
 * @multiSigTxValue
 * @multiSigTxHash
 * @refundAddress
 * @paymentAddress
 * @clientMultiSigKey
 * @serverPubKey
 */
function Payment(args) {
	this.compulsoryProperties = ['amount', 'multiSigTxValue', 'multiSigTxHash', 
		'refundAddress', 'paymentAddress', 'clientMultiSigKey', 'serverPubKey'
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

	var fee = 0;
	if (!args.fee) {
		fee = 300;
	}

	if (args.fee < 300) {
		throw new Error('fee cannot be less than 300 Satoshis');
	}

	if (args.amount + fee > args.multiSigTxValue) {
		throw new Error('insufficient input value to cover for output value');
	}

	if (args.locktime) {
		txb.tx.locktime = args.locktime;
		txb.addInput(args.multiSigTxHash, 0, 0);
	} else {
		if (args.sequence) {
			txb.addInput(args.multiSigTxHash, 0, args.sequence);	
		} else {
			txb.addInput(args.multiSigTxHash, 0);
		}
	}

	txb.addOutput(args.paymentAddress, args.amount);
	if ((args.multiSigTxValue - args.amount - args.fee) > 0) {
		txb.addOutput(args.refundAddress, args.multiSigTxValue - args.amount - args.fee);
	}

	var pubKeys = [
		args.clientMultiSigKey.getPublicKeyBuffer(),
		new Buffer(args.serverPubKey, 'hex')
	];
	
	var redeemScript = bitcoin.script.multisigOutput(2, pubKeys);
	txb.sign(0, args.clientMultiSigKey, redeemScript);

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
			throw new Error('Compulsory property omitted : \"' + p + '\"');
		}
	})

	if (!args.serverMultiSigKey instanceof bitcoin.ECPair) {
		throw new Error('args.serverMultiSigKey should be type ECPair');
	}

	var network = args.network ? args.network : bitcoin.networks.testnet;

	var txb = bitcoin.TransactionBuilder.fromTransaction(args.tx, network);
	var pubKeys = [
		new Buffer(args.clientPublicKey, 'hex'),
		args.serverMultiSigKey.getPublicKeyBuffer()
	];	
	var redeemScript = bitcoin.script.multisigOutput(2, pubKeys);

	txb.sign(0, args.serverMultiSigKey, redeemScript);
	return txb.build();
}

module.exports = Payment;