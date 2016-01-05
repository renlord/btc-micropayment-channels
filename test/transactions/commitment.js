var assert 					= require('assert');
var bitcoin					= require('bitcoinjs-lib');
var PaymentChannel 	= require('../../');

var blocktrail 			= require('blocktrail-sdk').BlocktrailSDK({
	apiKey : '6d740cd142f3fca5a75173ee07e3c60214bbc566',
	apiSecret : '2a66e3a2aba3ec37939d747cbae577994811bef3',
	network : 'BTC',
	testnet : true
});

describe('commitTx', function() {
	var tempkey = bitcoin.ECPair.fromWIF('cMtAb5kZR1peExLHZrygMqjJBjBGskMiGS95rCD7iRZJyMUtgjMg', 
		bitcoin.networks.testnet);
	var address = tempkey.getAddress();


	it('can be created', function() {
		blocktrail.addressUnspentOutputs(address, function(err, utxos) {
			
			utxos = utxos.data;

			var utxosKeys = [];
			for (var i = 0; i < utxos.length; i++) {
				utxosKeys.push(tempkey);
			}

			var commitmentTx = new payment_channel.Commitment({
        network : bitcoin.networks,
        utxos : utxos.data,
        utxosKeys : [clientkey, clientkey, clientkey],
        providerPubKey : "02371db33fa36f912e50142f2e0eae949db1291f9221f072c59ba5b3e8136282f9",
        changeAddress : 'n3C6KQBdkvUiFJrXwAvAsK1JJqMxKWCBo2',
        amount : 500,
        fee : 300
   		}).tx;

			assert.equal(commitmentTx.toHex(), '0100000003b400b1032eca25ef7aab2380f11557531454e0e14253d2849ae18a2d8e25999c000000006a473044022012ffe97337fbb573eabe9cbb0b8c64ec772dd8fb52140a8d3d3fe523a15a50b10220577f6a319bb504b43d66c5cba98b593e55660518ab1d311d4240589de4b61ce6012102371db33fa36f912e50142f2e0eae949db1291f9221f072c59ba5b3e8136282f9ffffffff9a9efb671a6ae5c255f61a0652a0e7b2884eb5223f224a18c0da93d8baf9320b010000006b483045022100fd7c2d3f0d94749bd0edb7f37d801fac605cf6355d2c38a0f29a32fe97ab0408022030c3661662522becae1fa46b6b35821cb128dc7eab1470667443af9806736eac012102371db33fa36f912e50142f2e0eae949db1291f9221f072c59ba5b3e8136282f9ffffffff7f4b279f4430e4bfa0d23b8426e8f935108694a16d0ee26c44baf4b77e1d4964020000006b4830450221009128365807b7bde26366a75c4e45608223f6d536c99419ca196fd6495276d5f5022069972826d1b68173795c088985aed56fddb7a3389b5e83fed82df02bd10f30bc012102371db33fa36f912e50142f2e0eae949db1291f9221f072c59ba5b3e8136282f9ffffffff02f40100000000000017a9146250ccd8d048ab1200dcc6e323d031425dec1d2b87dc3e0300000000001976a914edc18fb8b6d700a8ca3b91e4c5c419f7afb2337088ac00000000',
				'transaction hex hashstring does not match!'
			);
		})
	})
});

