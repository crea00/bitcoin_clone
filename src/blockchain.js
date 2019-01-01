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

const getLastBlock = () => blockchain[blockchain.length - 1];

const getTimestamp = () => new Date().getTime() / 1000;

const createHash = (index, previousHash, timestamp, data) =>
  CryptoJS.SHA256(index + previousHash + timestamp + data).toString();

const createNewBlock = data => {
  const previousBlock = getLastBlock();
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
  return newBlock;
};

const getBlocksHash = (block) => createHash(
  block.index,
  block.previousHash,
  block.timestamp,
  block.data
);

const isNewBlockValid = (candidateBlock, latestBlock) => {
  if (latestBlock.index + 1 === candidateBlock.index) {
    console.log('The candidate block does not have a valid index');
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
