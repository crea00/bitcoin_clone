const CryptoJS = require('crypto-js'),
  hexToBinary = require('hex-to-binary');

const BLOCK_GENERATION_INTERVAL = 10;
const DIFFICULTY_ADJUSTMENT_INTERVAL = 10;

class Block {
  constructor(index, hash, previousHash, timestamp, data, difficulty, nonce) {
    this.index = index;
    this.hash = hash;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.data = data;
    this.difficulty = difficulty;
    this.nonce = nonce;
  }
}

const genesisBlock = new Block(
  0,
  '5A193CC5D9197585F4EEF9E2B8064E58AB3345372BDD5BE36E48CB9249D4333A',
  null,
  1546337562415,
  'This is the genesis!!',
  0,
  0
);

let blockchain = [genesisBlock];

const getNewestBlock = () => blockchain[blockchain.length - 1];

const getTimestamp = () => new Date().getTime() / 1000;

const getBlockchain = () => blockchain;

const createHash = (index, previousHash, timestamp, data, difficulty, nonce) =>
  CryptoJS.SHA256(
    index + previousHash + timestamp + JSON.stringify(data) + difficulty + nonce
  ).toString();

const createNewBlock = data => {
  const previousBlock = getNewestBlock();
  const newBlockIndex = previousBlock.index + 1;
  const newTimestamp = getTimestamp();
  const difficulty = findDifficulty();
  const newBlock = findBlock(
    newBlockIndex,
    previousBlock.hash,
    newTimestamp,
    data,
    difficulty
  );
  
  addBlockToChain(newBlock);
  require('./p2p').broadcastNewBlock();
  return newBlock;
};

const calculateNewDifficulty = (newestBlock, blockchain) => {
  const lastCalculatedBlock = blockchain[blockchain.length - DIFFICULTY_ADJUSTMENT_INTERVAL];
  const timeExpected = BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL;
  const timeTaken = newestBlock.timestamp - lastCalculatedBlock.timestamp;

  if (timeTaken < (timeExpected / 2)) {
    return lastCalculatedBlock.difficulty + 1;
  } else if (timeTaken > (timeExpected * 2)) {
    return lastCalculatedBlock.difficulty - 1;
  } else {
    return lastCalculatedBlock.difficulty;
  }
};

const findDifficulty = () => {
  const newestBlock = getNewestBlock();
  if (
    newestBlock.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0 &&
    newestBlock.index !== 0
  ) {
    return calculateNewDifficulty(newestBlock, getBlockchain());
  } else {
    return newestBlock.difficulty;
  }
};

const findBlock = (index, previousHash, timestamp, data, difficulty) => {
  let nonce = 0;
  while(true) {
    console.log(`Current nonce: ${nonce}`);
    const hash = createHash(
      index,
      previousHash,
      timestamp,
      data,
      difficulty,
      nonce
    );
    if (hashMatchesDifficutly(hash, difficulty)) {
      return new Block(
        index,
        hash,
        previousHash,
        timestamp,
        data,
        difficulty,
        nonce
      );
    }
      nonce++;
  }
};

const hashMatchesDifficutly = (hash, difficulty) => {
  const hashInBinary = hexToBinary(hash);
  const requiredZeros = '0'.repeat(difficulty);
  console.log(`Trying difficulty: ${difficulty} with hash: ${hashInBinary}`);
  return hashInBinary.startsWith(requiredZeros);
};

const getBlocksHash = (block) => createHash(
  block.index,
  block.previousHash,
  block.timestamp,
  block.data,
  block.difficulty,
  block.nonce
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