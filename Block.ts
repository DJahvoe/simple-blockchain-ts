import * as crypto from 'crypto';

const SHA256 = (message: string) =>
	crypto.createHash('sha256').update(message).digest('hex');

export type Transaction = {
	id: string;
	sender: string;
	receiver: string;
	amount: number;
};

class Block {
	index: number;
	timestamp: string;
	transactions: Transaction[] | [];
	hash: string;
	prevHash: string;
	nonce: number;
	constructor(timestamp = '', transactions = []) {
		this.index = 1;
		this.timestamp = timestamp;
		// this.data should contain information like transactions.
		this.transactions = transactions;
		this.hash = this.getHash();
		this.prevHash = '';
		this.nonce = 0;
	}

	// Our hash function.
	getHash() {
		return SHA256(
			this.prevHash +
				this.timestamp +
				JSON.stringify(this.transactions) +
				this.nonce
		);
	}

	mine(difficulty: number) {
		while (!this.hash.startsWith(Array(difficulty + 1).join('0'))) {
			// We increases our nonce so that we can get a whole different hash.
			this.nonce++;
			// Update our new hash with the new nonce value.
			this.hash = this.getHash();
			// console.log(this.hash);
		}
	}
}

export default Block;
