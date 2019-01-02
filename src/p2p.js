const WebSockets = require('ws');

const sockets = [];

const StartP2PServer = server => {
  const wsServer = new WebSockets.Server({ server });
  wsServer.on('Connection', ws => {
    console.log(`Hello! ${ws}`);
  });
  console.log('BitcoinClone P2P Server running!');
};

module.exports = {
  StartP2PServer
};