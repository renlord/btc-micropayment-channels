"use strict";
var bitcoin 		= require('bitcoinjs-lib');
var Refund 			= require('./transaction/refund');
var Commitment 	= require('./transaction/commitment');
var Payment 		= require('./transaction/payment');

const BIT = 100; 
/**
 * Consumer instance for client side
 *
 * ARGUMENTS {} 
 * @consumerKeyPair [OPTIONAL], this is used to create the shared account
 * @providerPubKey, used to create multi sig shared account
 * @refundAddress, address where multisig output should be refunded to
 * @paymentAddress, address where multisig output should be paid to
 * @utxos, unspent transaction outputs
 * @utxoKeys, keypairs to spend `utxos`
 * @depositAmount, amount to be deposited into the shared account
 * @txFee
 * @network [OPTIONAL]
 */
function Consumer(opts) {

	var compulsoryProperties = ['providerPubKey', 'refundAddress',
		'paymentAddress', 'utxos', 'utxoKeys', 'txFee', 'depositAmount'
	];

	opts.forEach(function(opt) {
		if (!opt) {
			throw new Error('missing parameter in argument object : \"' + opt + '\"');
		}
	})

	var network = opts.network ? opts.network : bitcoin.networks.testnet;

	this._paymentCounter = 0;

	if (opts.txFee < (3 * BIT)) {
		throw new Error('txFee is too low. min. txFee is set to 3bits');
	}
	this._txFee = opts.txFee;

	// check total value of utxos
	if (!utxos instanceof Array || !utxoKeys instanceof Array) {
		throw new Error('utxos and utxoKeys should be of type Array');
	}

	if (utxos.length !== utxoKeys.length) {
		throw new Error('insufficient keypairs to authorise utxo spends');
	}

	var utxosValue = 0;
	utxos.forEach(function(utxo) {
		utxosValue += utxo.value;
	});

	if (utxosValue < (this._txFee + opts.depositAmount)) {
		throw new Error('insufficient utxo value to establish channel');
	}

	this._refundAddress = opts.refundAddress;
	this._paymentAddress = opts.paymentAddress;

	this._consumerKeyPair = opts.consumerKeyPair;
	this._providerPubKey = opts.providerPubKey;

	// Important Transactions
	this._commitmentTx = new Commitment({
		network : network,
    utxos : utxos,
    utxosKeys : utxoKeys,
    providerPubKey : this._providerPubKey,
    changeAddress : this._refundAddress,
    amount : opts.depositAmount,
    fee : this._txFee
	}).tx;

	this._refundTx = new Refund({

	}).tx;

	this._paymentTx = new Payment({

	}).tx;
}

Consumer.prototype.sendCommitmentTx = function(callback) {

	callback(this._commitmentTx);
}

/**
 * Used to broadcast the commitmentTx after the refundTx has been signed by the
 * provider and validated by the consumer.
 *
 * The callback allows flexible usage of an API suite of your choice. 
 *
 * @callback, a callback function to broadcast the commitmentTx or send the 
 * commitmentTx back to the provider.
 */
Consumer.prototype.broadcastCommitmentTx = function(callback) {

	callback(this._commitmentTx.getId());
}

/**
 * If things go south with the provider, use this!
 *
 * @callback, a callback function to broadcast the refundTx to the Bitcoin Network
 */
Consumer.prototype.broadcastRefundTx = function(callback) {

	// if not due for broadcast, print the refundTx to stdout.

	callback(this._refundTx.getId());
}

Consumer.prototype.sendRefundTx = function(callback) {
	callback(this._refundTx);
}

/**
 * Used to validate the refundTx signed by the Provider.
 *
 * @tx, the refundTx sent back from the provider
 */
Consumer.prototype.validateRefund = function(tx) {

	return true;
}

/**
 * Used to increment the paymentTx iteratively.
 *
 * @amount, amount to increment by in Satoshis
 * @callback, a callback function to send the paymentTx back to the provider
 */
Consumer.prototype.incrementPayment = function(amount, callback) {

	callback(this._paymentTx.getId());
}

module.exports = Consumer;