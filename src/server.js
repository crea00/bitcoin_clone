const express = require('express'),
  bodyParser = require('body-parser'),
  morgan = require('morgan'),
  Blockchain = require('./blockchain'),
  P2P = require('./p2p'),
  wallet = require('./wallet');

const { getBlockchain, createNewBlock } = Blockchain;
const { startP2PServer, connectToPeers } = P2P;
const { initWallet } = wallet;

const PORT = process.env.HTTP_PORT || 3000;

const app = express();
app.use(bodyParser.json());
app.use(morgan('combined'));

app.get('/blocks', (req, res) => {
  res.send(getBlockchain());
});

app.post('/blocks', (req, res) => {
  const { body: { data } } = req;
  const newBlock = createNewBlock(data);
  res.send(newBlock);
});

app.post('/peers', (req, res) => {
  const { body: { peer }} = req;
  connectToPeers(peer);
  res.send();
});

const server = app.listen(PORT, () => 
  console.log(`Bitcoin Clone HTTP Server running on port ${PORT} ✅`)
);

initWallet();
startP2PServer(server);
