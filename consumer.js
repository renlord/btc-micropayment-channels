"use strict";
var bitcoin 		= require('bitcoinjs-lib');
var Refund 			= require('./transactions/refund');
var Commitment 	= require('./transactions/commitment');
var Payment 		= require('./transactions/payment');

const BIT = 100; 
const BTC = 100000000;
const TWO_HOURS = 60 * 60 * 2;

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
 * @depositAmount, amount to be deposited into the shared account in satoshis
 * @txFee
 * @locktime [OPTIONAL], default to one day
 * @network [OPTIONAL]
 */
function Consumer(opts) {

	var compulsoryProperties = ['providerPubKey', 'refundAddress',
		'paymentAddress', 'utxos', 'utxoKeys', 'txFee', 'depositAmount'
	];

	compulsoryProperties.forEach(function(prop) {
		if (!opts.hasOwnProperty(prop)) {
			throw new ParameterError('Compulsory property omitted : \"' + p + '\"');
		}
	})

	this._network = opts.network ? opts.network : bitcoin.networks.testnet;

	this._paymentCounter = 0;

	if (opts.txFee < (5 * BIT)) {
		throw new Error('txFee is too low. min. txFee is set to 5bits');
	}
	this._txFee = opts.txFee;

	// check total value of utxos
	if (!opts.utxos instanceof Array || !opts.utxoKeys instanceof Array) {
		throw new Error('utxos and utxoKeys should be of type Array');
	}

	if (opts.utxos.length !== opts.utxoKeys.length) {
		throw new Error('insufficient keypairs to authorise utxo spends');
	}

	var utxosValue = 0;
	opts.utxos.forEach(function(utxo) {
		utxosValue += utxo.amount * BTC;
	});
	utxosValue = Math.round(utxosValue);

	if (utxosValue < (this._txFee + opts.depositAmount)) {
		throw new Error('insufficient utxo value to establish channel');
	}

	this._refundAddress = opts.refundAddress;
	this._paymentAddress = opts.paymentAddress;

	if (opts.consumerKeyPair) {
		this._consumerKeyPair = opts.consumerKeyPair;
	} else {
		this._consumerKeyPair = bitcoin.ECPair.makeRandom({ network : this._network });
	}

	if (opts.providerPubKey instanceof String) {
		this._providerPubKey = new Buffer(opts.providerPubKey, 'hex');
	} else if (opts.providerPubKey instanceof Buffer) {
		this._providerPubKey = opts.providerPubKey;
	} else {
		throw new Error('invalid type for providerPubKey');
	}

	this._depositAmount = opts.depositAmount;
	
	// Important Transactions
	this._commitment = new Commitment({
		network : this._network,
    utxos : opts.utxos,
    utxosKeys : opts.utxoKeys,
    clientKeyPair : this._consumerKeyPair,
    providerPubKey : this._providerPubKey,
    changeAddress : this._refundAddress,
    amount : this._depositAmount,
    fee : this._txFee
	});

	this._commitmentTx = this._commitment.tx;
	this._commitmentTxOutputValue = this._commitmentTx.outs[0].value;

	this._refundTx = new Refund({
		network : this._network,
    fee : this._txFee,
    locktime : this._locktime,
    amount : this._commitmentTxOutputValue - this._txFee,
    utxos : [this._commitment.getMultiSigUTXO()],
    refundAddress : this._refundAddress,
    paymentAddress : this._paymentAddress,
    clientMultiSigKey : this._consumerKeyPair,
    serverPubKey : this._providerPubKey
	}).tx;

	this._sentAmount = 0;

	this._paymentTx = new Payment({
		network : this._network,
    fee : this._txFee,
    amount : this._sentAmount,
    sequence : this._paymentCounter,
    utxos : [this._commitment.getMultiSigUTXO()],
    refundAddress : this._refundAddress,
    paymentAddress : this._paymentAddress,
    clientMultiSigKey : this._consumerKeyPair,
    serverPubKey : this._providerPubKey
	}).tx;
}

/**
 * convenience function (OPTIONAL workflow)
 * 
 * ARGUMENTS
 * @callback, a callback function to send the commitmentTx (ie. to fund the shared account)
 */
Consumer.prototype.sendCommitmentTx = function(callback) {
	callback(this._commitmentTx.toHex());
}

/**
 * convenience function (COMPULSORY workflow)
 * the Consumer instance should ALWAYS communicate the consumer public key to
 * the provider.
 * 
 * ARGUMENTS
 * @callback, a callback function to send the consumer pubkey.
 */
Consumer.prototype.sendConsumerPubKey = function(callback) {
	callback(this._consumerKeyPair.getPublicKeyBuffer().toString('hex'));
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
	callback(this._commitmentTx.toHex());
}

/**
 * If things go south with the provider, use this!
 *
 * @callback, a callback function to broadcast the refundTx to the Bitcoin Network
 */
Consumer.prototype.broadcastRefundTx = function(callback) {
	var time = Math.floor((new Date).getTime() / 1000);
	if ((this._refundTx.locktime - time) > TWO_HOURS) {
		console.log('\n\nTransaction Hash: \"' + this._refundTx.getId() + '\"\n\n');
		throw new Error('recent bitcoin protocol changes forbids the broadcast of \
			transactions until they are due to be committed to the blockchain!');
	}
	// if not due for broadcast, print the refundTx to stdout.
	callback(this._refundTx.toHex());
}

/**
 * convenience function
 * sends the refundTx to the server for signing
 */
Consumer.prototype.sendRefundTx = function(callback) {
	callback(this._refundTx.toHex());
}

/**
 * Used to validate the refundTx signed by the Provider.
 *
 * @tx, the refundTx sent back from the provider
 */
Consumer.prototype.validateRefund = function(tx) {
	// TODO: validate the refundTx
	this._refundTx = tx;
	return true;
}

/**
 * Used to increment the paymentTx iteratively.
 *
 * @amount, amount to increment by in Satoshis
 * @callback, a callback function to send the paymentTx back to the provider
 */
Consumer.prototype.incrementPayment = function(amount, callback) {
	this._sentAmount += amount;

	if (this._sentAmount > this._depositAmount) {
		throw new Error('insufficient funds to increment payments');
	}

	this._paymentTx = new Payment({
		network : this._network,
    fee : this._txFee,
    amount : this._sentAmount,
    sequence : ++this._paymentCounter,
    utxos : [this._commitment.getMultiSigUTXO()],
    refundAddress : this._refundAddress,
    paymentAddress : this._paymentAddress,
    clientMultiSigKey : this._consumerKeyPair,
    serverPubKey : this._providerPubKey
	}).tx;

	callback(this._paymentTx.toHex());
}

module.exports = Consumer;