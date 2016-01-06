"use strict";
var bitcoin = require('bitcoinjs-lib');
var Payment = require('./payment');

const DAY = 60 * 60 * 24;
/**
 *
 * ARGUMENT {} object
 * @network [OPTIONAL]
 * @fee [OPTIONAL]
 * @locktime [OPTIONAL] duration of lock from now, defaults to a day
 * @amount 
 * @multiSigTxValue
 * @multiSigTxHash
 * @refundAddress
 * @paymentAddress
 * @clientMultiSigKey
 * @serverPubKey 
 */
function Refund(args) {
	var s = Math.floor((new Date).getTime() / 1000);
	args.locktime = args.timelock ? (s + args.timelock) : (s + DAY);

	var temp = args.refundAddress;
	args.refundAddress = args.paymentAddress;
	args.paymentAddress = args.refundAddress;

	Payment.call(this, args);
}

Refund.signTx = Payment.signTx;

module.exports = Refund;