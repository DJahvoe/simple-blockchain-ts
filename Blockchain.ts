import Block, { Transaction } from './Block';
import axios from 'axios';

class Blockchain {
	chain: Block[];
	nodes: Set<string>;
	mempools: Transaction[];
	difficulty: number;
	constructor() {
		// Create genesis block
		const newBlock = new Block(Date.now().toString());
		newBlock.index = 1;
		// This property will contain all the blocks.
		this.chain = [newBlock];

		this.mempools = [];

		this.nodes = new Set();

		this.difficulty = 4;
	}

	getLastBlock() {
		return this.chain[this.chain.length - 1];
	}

	addBlock(block: Block) {
		block.index = this.chain.length + 1;
		// Since we are adding a new block, prevHash will be the hash of the old latest block
		block.prevHash = this.getLastBlock()?.hash;

		// Add transactions from mempools to block, and reset mempools
		block.transactions = this.mempools;
		this.mempools = [];

		// Since now prevHash has a value, we must reset the block's hash
		block.hash = block.getHash();

		// Find the correct hash
		block.mine(this.difficulty);

		// Object.freeze ensures immutability in our code
		this.chain.push(Object.freeze(block));
		return block;
	}

	addTransactionToMempools(transaction: Transaction) {
		this.mempools.push(transaction);
	}

	addNode(address: string) {
		const parsedUrl = new URL(address);
		this.nodes.add(parsedUrl.host);
	}

	// Consensus for all the nodes in the network
	async replaceChain() {
		const network = this.nodes;
		let longestChain = null;
		let maxLength = this.chain.length;

		for (let nodes in network) {
			const response = await axios.get(`http://${nodes}/get_chain`);
			if (response.status == 200) {
				const data = response.data;
				const { chain, length } = data;

				if (length > maxLength && this.isValid(chain)) {
					maxLength = length;
					longestChain = chain;
				}
			}
		}

		if (longestChain) {
			this.chain = longestChain;
			return true;
		}
		return false;
	}

	isValid(blockchain = this) {
		// Iterate to the whole chain
		for (let i = 1; i < blockchain.chain.length; i++) {
			const currentBlock = blockchain.chain[i];
			const prevBlock = blockchain.chain[i - 1];

			// Check validation
			if (
				currentBlock.hash !== currentBlock.getHash() ||
				prevBlock.hash !== currentBlock.prevHash
			)
				return false;
		}
	}

	getChain() {
		return this.chain;
	}
}

export default Blockchain;
