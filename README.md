# Bitcoin Simple Payment Channels
---
### Why was this written?
I tried using Bitcore's Payment Channels, it was a nightmare.

Why not bitcoinj? BitcoinJ is fantastic if you're building applications, but not so good for the web. Unless there was a way to run Java Libraries on Web Clients? 

### Focus of this Repo
1. Simplicity 
This repo is really dedicated to solely payment channels, nothing fancy is added to it. However some assumptions had to be made. It is assumed that there does not exist a Wallet out there that could run Payment Channels. So you'll have to fund a "Temporary Client Wallet" to initiate the Payment Channels. Ideas to work around this is welcomed!

2. Down to Bitcoin Basics
A lot of libraries out there do a lot of abstraction for you which is great and all but it is horribly difficult to work if left unmaintained. One such example is Bitcore's Payment Channel JS Library. I've intentionally only stuck to "bitcoinjs-lib" only just for my own sanity's sake and yours if you'd like to know what is going on under the hood.

3. Learning the Basics
I also wrote this so I could learn the fundamentals and it was good practice.

### Disclaimer
Given what is said above, I strongly insist that this runs only on "testnet". Even so, please make an effort to not "accidentally" destroy any testnet coins!
