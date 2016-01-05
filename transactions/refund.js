"use strict";
var bitcoin = require('bitcoinjs-lib');
var Payment = require('./payment');

const DAY = 60 * 60 * 24;
/**
 *
 * ARGUMENT {} object
 * @network [OPTIONAL]
 * @fee [OPTIONAL]
 * @locktime [OPTIONAL] defaults to a day
 * @amount 
 * @multiSigTxValue
 * @multiSigTxHash
 * @refundAddress
 * @paymentAddress
 * @clientMultiSigKey
 * @serverPubKey 
 */
function Refund(args) {
	Payment.call(this, compulsoryProperties);

	this.compulsoryProperties.forEach(function(p) {
		if (!args.hasOwnProperty(p)) {
			throw new Error('Compulsory property omitted : \"' + p + '\"');
		}
	});

	args.locktime = args.timelock ? args.timelock : DAY;

	var temp = args.refundAddress;
	args.refundAddress = args.paymentAddress;
	args.paymentAddress = args.refundAddress;

	return new Payment(args);
}

Refund.prototype = Object.create(Payment);

module.exports = Refund;