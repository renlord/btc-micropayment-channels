"use strict";
var bitcoin 		= require('bitcoinjs-lib');

const SATOSHI = 1;
const BIT 		= 100 * SATOSHI; 
const BTC 		= 100000000;

const MIN_FEE = 1000;

/**
 * Commitment object is a Lock Transaction
 * 
 * Arguments (OBJECT {}):
 * @utxos, unspent transaction outputs
 * @utxosKeys, keys to sign for UTXOs 
 * @clientKeyPair, client ECPair 
 * @providerPubKey, provider public key for multisig 
 * @changeAddress, address to send difference in payment and fees
 * @amount, amount in satoshis to pay to multisig output
 * @fee[OPTIONAL], payment fees. Defaults to 300 bits.
 * @network[OPTIONAL], 'livenet'(default) or 'testnet' 
 */
function Commitment(args) {
	var compulsoryProperties = ['utxos', 'utxosKeys', 'clientKeyPair', 
		'providerPubKey', 'changeAddress', 'amount'
	];

	compulsoryProperties.forEach(function(p) {
		if (!args.hasOwnProperty(p)) {
			throw new Error('missing object parameter for commitmentTx : \"' + p + '\"');
		}
	});

	var network = args.network ? args.network : bitcoin.networks.testnet;
	var txb = new bitcoin.TransactionBuilder(network);
	
	var fee = args.fee ? args.fee : MIN_FEE;

	if (fee < MIN_FEE) {
		throw new Error('too little fees!');
	}

	var multiSigScriptKeys = [
		args.clientKeyPair.getPublicKeyBuffer(),
		new Buffer(args.providerPubKey, 'hex')
	];

	this.multiSigOutputScript = bitcoin.script.multisigOutput(2, multiSigScriptKeys);
	this.multiSigScriptHash = bitcoin.script.scriptHashOutput(
		bitcoin.crypto.hash160(this.multiSigOutputScript));
	this.commitmentAddress = bitcoin.address.fromOutputScript(this.multiSigScriptHash, 
		network);
	//console.log('shared account payment address : ' + this.commitmentAddress);

	if (args.utxos.length !== args.utxosKeys.length) {
		throw new Error('number of ecpair keys do not match number of unspent transaction outputs');
	}	

	var utxosValue = 0; // in satoshis...

	args.utxos.forEach(function(utxo) {
		utxosValue += Math.round(utxo.amount * BTC); 
		txb.addInput(utxo.txid, utxo.vout, bitcoin.Transaction.DEFAULT_SEQUENCE);
	})

	if ((args.amount + fee) > utxosValue) {
		throw new Error('Insufficient Input Funds for Output');
	}

	this.multiSigScriptHashValue = args.amount;

	txb.addOutput(this.commitmentAddress, this.multiSigScriptHashValue);
	if (args.amount < utxosValue) {
		txb.addOutput(args.changeAddress, utxosValue - args.amount - fee);
	}

	for (var i = 0; i < args.utxosKeys.length; i++) {
	 	txb.sign(i, args.utxosKeys[i]);
	}

	this.tx = txb.build();
}

Commitment.prototype.getMultiSigOutputValue = function() {
	return this.multiSigScriptHashValue;
}

Commitment.prototype.getMultiSigOutputScript = function() {
	return this.multiSigOutputScript;
}

module.exports = Commitment;