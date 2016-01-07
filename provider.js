"use strict";
var bitcoin 		= require('bitcoinjs-lib');
var Refund 			= require('./transactions/refund');
var Commitment 	= require('./transactions/commitment');
var Payment 		= require('./transactions/payment');

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

	this._network = opts.network ? opts.network : bitcoin.networks.testnet;

	if (opts.providerKeyPair) {
		if (!opts.providerKeyPair instanceof bitcoin.ECPair) {
			throw new Error('provided providerKeyPair should be type bitcoin.ECPair');
		}
		this._providerKeyPair = opts.providerKeyPair;
	} else {
		this._providerKeyPair = bitcoin.ECPair.makeRandom({ network : this._network });
	}

	if (!consumerPubKey instanceof String) {
		throw new Error('consumerPubKey should be type String');
	}

	// Important Properties
	this._receivedAmount = 0;

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
 * upon success, it will be stored in this._refundTx
 *
 * ARGUMEMTS
 * @txHash, refundTx hash
 */
Provider.prototype.signRefundTx = function(txHash) {
	this._checkConsumerPubKey();
	
	// TODO: check refundTx is correct
	var tx = bitcoin.Transaction.fromHex(txHash);
	var txb = bitcoin.TransactionBuilder.fromTransaction(tx, this._network);
	var pubKeys = [
		this._consumerPubKey,
		this._providerKeyPair.getPublicKeyBuffer()
	];
	var redeemScript = bitcoin.script.multisigOutput(2, pubKeys);
	txb.sign(0, this._providerKeyPair, redeemScript);
	this._refundTx = txb.build();
}

Provider.prototype.sendRefundTx = function(callback) {
	if (!this._refundTx) {
		throw new Error('refundTx not yet received and signed');
	}
	callback(this._refundTx.toHex());
}

/**
 * convenience function (OPTIONAL workflow)
 */
Provider.prototype.broadcastCommitmentTx = function(txHash, callback) {
	// verify commitmentTx
	callback(txHash);
}

/**
 * checks and signs the paymentTx 
 * 
 * ARGUMENTS
 * @txHash, paymentTx transaction hash
 * @
 */
Provider.prototype.checkAndSignPaymentTx = function(txHash, expectedAmount) {	
	this._checkConsumerPubKey();

	var tx = bitcoin.Transaction.fromHex(tx);

	// check transaction
	if (tx.outs[0].value !== expectedAmount) {
		throw new PaymentTxError('consumer prepared invalid paymentTx');
	}

	this._paymentTx = Payment.signTx({
		tx : tx,
		serverMultiSigKey : this._providerKeyPair,
		clientPublicKey : this._consumerPubKey,
		network : this._network
	});
}

Provider.prototype.broadcastPaymentTx = function(callback) {
	if (this._paymentTx === null) {
		throw new Error('there is no paymentTx yet');
	}
	callback(this._paymentTx.toHex());
}

module.exports = Provider;