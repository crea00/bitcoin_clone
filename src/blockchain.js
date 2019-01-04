const CryptoJS = require('crypto-js');

class Block {
  constructor(index, hash, previousHash, timestamp, data) {
    this.index = index;
    this.hash = hash;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.data = data;
  }
}

const genesisBlock = new Block(
  0,
  '5A193CC5D9197585F4EEF9E2B8064E58AB3345372BDD5BE36E48CB9249D4333A',
  null,
  1546337562415,
  'This is the genesis!!'
);

let blockchain = [genesisBlock];

const getNewestBlock = () => blockchain[blockchain.length - 1];

const getTimestamp = () => new Date().getTime() / 1000;

const getBlockchain = () => blockchain;

const createHash = (index, previousHash, timestamp, data) =>
  CryptoJS.SHA256(
    index + previousHash + timestamp + JSON.stringify(data)
  ).toString();

const createNewBlock = data => {
  const previousBlock = getNewestBlock();
  const newBlockIndex = previousBlock.index + 1;
  const newTimestamp = getTimestamp();
  const newHash = createHash(
    newBlockIndex,
    previousBlock.hash,
    newTimestamp,
    data
  );
  const newBlock = new Block(
    newBlockIndex,
    newHash,
    previousBlock.hash,
    newTimestamp,
    data
  );
  addBlockToChain(newBlock);
  return newBlock;
};

const getBlocksHash = (block) => createHash(
  block.index,
  block.previousHash,
  block.timestamp,
  block.data
);

const isBlockValid = (candidateBlock, latestBlock) => {
  if(!isBlockStructureValid(candidateBlock)) {
    console.log('The candidateBlock structure is not valid');
    return false;
  } else if (latestBlock.index + 1 !== candidateBlock.index) {
    console.log('The candidateblock does not have a valid index');
    return false;
  } else if (latestBlock.hash !== candidateBlock.previousHash) {
    console.log('The prevousHash of candidateBlock is not the hash of the latest block');
    return false;
  } else if (getBlocksHash(candidateBlock) !== candidateBlock.hash) {
    console.log('The hash of this block is invalid');
    return false;
  } 
  return true;
};

const isBlockStructureValid = (block) => {
  return (
    typeof block.index === 'number'
    && typeof block.hash === 'string'
    && typeof block.previousHash === 'string'
    && typeof block.timestamp === 'number'
    && typeof block.data === 'string'
  );
};

const isChainValid = (candidateChain) => {
  const isGenesisValid = block => {
    return JSON.stringify(block) === JSON.stringify(genesisBlock);
  };
  if (!isGenesisValid(candidateChain[0])) {
    console.log('The candidateChain\'s genesisBlock is not the same as our genesisBlock');
    return false;
  }
  for(let i = 1; i < candidateChain.length; i++) {
    if (!isBlockValid(candidateChain[i], candidateChain[i - 1])) {
      return false;
    }
  }
  return true;
};

const replaceChain = candidateChain => {
  if (
    isChainValid(candidateChain) && 
    candidateChain.length > getBlockchain().length
  ) {
    blockchain = candidateChain;
    return true;
  } else {
    return false;
  }
};

const addBlockToChain = candidateBlock => {
  if (isBlockValid(candidateBlock, getNewestBlock())) {
    blockchain.push(candidateBlock);
    return true;
  } else {
    return false;
  }
};

module.exports = {
  addBlockToChain,
  getBlockchain,
  createNewBlock,
  getNewestBlock,
  isBlockStructureValid,
  replaceChain,
};