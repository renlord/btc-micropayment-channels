"use strict";
var bitcoin 		= require('bitcoinjs-lib');
var ECPair 			= require('bitcoinjs-lib').ECPair;
var networks 		= require('bitcoinjs-lib').networks;
var Refund 			= require('./transaction/refund');
var Commitment 	= require('./transaction/commitment');
var Payment 		= require('./transaction/payment');
/**
 *
 */
function Consumer(opts) {
	this.network = opts.network;
	this.paymentCounter = 0;
	this.fee = opts.fee;
	this.depositAmount = opts.depositAmount;
	this.refundAddress = opts.refundAddress;

	// Important Transactions
	this.commitmentTx = null;
	this.refundTx = null;
	this.paymentTx = null;
}

Consumer.prototype.setupRefundTx = function() {

}

Consumer.prototype.validateRefundTx = function(tx) {

}

/** 
 * The consumer object by default does not broadcast the refund transaction due
 * to the time lock. 
 */
Consumer.prototype.getRefundTx = function() {

}

Consumer.prototype.validateRefund = function() {

}

Consumer.prototype.incrementPayment = function(amount) {

}

/**
 * processes a list of unspent transaction outputs
 */
Consumer.prototype.processFunding = function(utxos) {
	this.commitmentTx = new Commitment(networks.testnet);
	this.commitmentTx.setupInput(utxos);
	this.commitmentTx.setupOutput(changeAddress);
}

module.exports = Consumer;