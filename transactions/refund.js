"use strict";
var bitcoin = require('bitcoinjs-lib');
var Payment = require('./payment');
/**
 * Commitment object is a Lock Transaction
 *
 * @network
 * @multiSigTx
 * @commitmentKey
 * @refundAddress
 * @amount
 * @fee
 */
function Refund(network, multiSigTx, commitmentKey, refundAddress, amount, fee) {
	return new Payment(network, multiSigTx, commitmentKey, refundAddress, amount, fee);
}

module.exports = Refund;