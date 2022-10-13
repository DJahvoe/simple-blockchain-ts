import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import Blockchain from './Blockchain';
import Block from './Block';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT;

const blockchain = new Blockchain();
const nodeAddress = uuidv4().replace(/-/g, '');

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
	res.sendFile(__dirname + '/index.html');
});

app.get('/mine_block', (req: Request, res: Response) => {
	blockchain.addTransactionToMempools({
		id: uuidv4(),
		sender: 'SAV',
		receiver: 'SAV2',
		amount: 100,
	});
	blockchain.addTransactionToMempools({
		id: uuidv4(),
		sender: nodeAddress,
		receiver: 'SAV',
		amount: 10,
	});

	const block = new Block(Date.now().toString());
	const newBlock = blockchain.addBlock(block);
	res.send(
		JSON.stringify({
			code: 200,
			message: 'Congratulation, you just mined a block!',
			block: newBlock,
		})
	);
});

app.get('/get_chain', (req: Request, res: Response) => {
	let chain = blockchain.getChain();

	res.send(
		JSON.stringify({
			code: 200,
			chain: chain,
			length: chain.length,
		})
	);
});

app.get('/is_chain_valid', (req: Request, res: Response) => {
	res.send(
		JSON.stringify({
			code: 200,
			validityStatus: blockchain.isValid(),
		})
	);
});

app.post('/add_transaction', (req: Request, res: Response) => {
	const body = req.body;
	const requiredKeys = ['sender', 'receiver', 'amount'];
	for (let key of requiredKeys) {
		if (!(key in body)) {
			res.send(
				JSON.stringify({
					code: 400,
					message: `${key} key is required on the request`,
				})
			);
			return;
		}
	}

	blockchain.addTransactionToMempools(body);

	res.send(
		JSON.stringify({
			code: 200,
			message: 'successfully added transaction to mempools',
		})
	);
});

app.post('/connect_node', (req: Request, res: Response) => {
	const nodes = req.body.nodes;
	if (nodes === null)
		res
			.send(
				JSON.stringify({
					message: 'Nodes is required on the request',
				})
			)
			.status(400);

	for (let node of nodes) {
		blockchain.addNode(node);
	}

	res
		.send(
			JSON.stringify({
				message:
					'All the nodes are now connected. The SavkCoin Blockchain now contains the following nodes',
				nodes: blockchain.nodes,
			})
		)
		.status(200);
});

app.get('/replace_chain', async (req: Request, res: Response) => {
	const isChainReplaced = await blockchain.replaceChain();

	res
		.send(
			JSON.stringify({
				message: isChainReplaced
					? 'Chain is replaced by the longer one on the other node'
					: 'All good, chain is the longest one',
				replacementStatus: isChainReplaced,
				chain: blockchain.getChain(),
			})
		)
		.status(200);
});

app.listen(PORT, () => {
	console.log(`App is listening on port ${PORT}: http://localhost:${PORT}`);
});
