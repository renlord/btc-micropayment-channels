"use strict";
var bitcoin 		= require('bitcoinjs-lib');
var Refund 			= require('./transaction/refund');
var Commitment 	= require('./transaction/commitment');
var Payment 		= require('./transaction/payment');

const BIT = 100; 

/**
 * Provider instance for server side
 *
 * ARGUMENTS {} 
 * @providerKeyPair [OPTIONAL], this is used to create the shared account
 * @consumerPubKey, [DEFERED] used for verification and building redeemScripts.
 * @refundAddress, [OPTIONAL] address where multisig output should be refunded to
 * @paymentAddress, [OPTIONAL] address where multisig output should be paid to
 * @network [OPTIONAL]
 */
function Provider(opts) {
	if (!opts.consumerPubKey) {
		throw new Error('consumerPubKey must be provided');
	}

	var network = opts.network ? opts.network : bitcoin.networks.testnet;

	if (opts.providerKeyPair) {
		if (!opts.providerKeyPair instanceof bitcoin.ECPair) {
			throw new Error('provided providerKeyPair should be type bitcoin.ECPair');
		}
		this._providerKeyPair = opts.providerKeyPair;
	} else {
		this._providerKeyPair = bitcoin.ECPair.makeRandom({ network : network });
	}

	if (!consumerPubKey instanceof String) {
		throw new Error('consumerPubKey should be type String');
	}

	// Important Transactions
	this._commitmentTx = null;
	this._paymentTx = null;
}

Provider.prototype.setConsumerPubKey = function(consumerPubKey) {
	if (!consumerPubKey instanceof String) {
		throw new Error('consumerPubKey should be type String');
	} 
	this._consumerPubKey = new Buffer(consumerPubKey, 'hex');
}

/**
 * private method.
 */
Provider.prototype._checkConsumerPubKey = function() {
	if (!this._consumerPubKey) {
		throw new Error('consumerPubKey should be set for the Provider instance');
	}
}

/**
 * Public key for Shared Account
 *
 * return the public key for the multisig
 */
Provider.prototype.getSharedPubKey = function() {
	return this._providerKeyPair.getPublicKeyBuffer().toString('hex');
}

/**
 * performs a basic check of the refundTx then signs it
 *
 * ARGUMEMTS
 * @tx, refundTx
 */
Provider.prototype.signRefundTx = function(tx) {
	this._checkConsumerPubKey();

	return tx;
}

Provider.prototype.broadcastCommitmentTx = function(tx, callback) {
	// verify commitmentTx
	this._commitmentTx = tx;
	callback(this._commitmentTx);
}

Provider.prototype.checkPaymentTx = function(tx, expectedAmount) {
	
}

Provider.prototype.signPaymentTx = function(tx) {

}

Provider.prototype.broadcastPaymentTx = function(callback) {
	if (this._paymentTx === null) {
		throw new Error('there is no paymentTx yet');
	}
	callback(this._paymentTx);
}