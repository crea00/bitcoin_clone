const CryptoJS = require('crypto-js'),
  EC = require('elliptic').ec,
  utils = require('./utils');

const ec = new EC('secp256k1');

const COINBASE_AMOUNT = 50;

class TxOut {
  constructor(address, amount) {
    this.address = address;
    this.amount = amount;
  }
}

class TxIn {
  // txOutId
  // txOutIndex
  // Signature
}

class Transaction {
  // ID
  // txIns[]
  // txOuts[]
}

class UTxOut {
  constructor(txOutId, txOutIndex, address, amount) {
    this.txOutId = txOutId;
    this.txOutIndex = txOutIndex;
    this.address = address;
    this.amount = amount;
  }
}

const getTxId = tx => {
  const txInContent = tx.txIns
    .map(txIn => txIn.TxOutId + txIn.txOutIndex)
    .reduce((a, b) => a + b, '');

  const txOutContent = tx.txOuts
    .map(txOut => txOut.address + txOut.amount)
    .reduce((a, b) => a + b, '');

  return CryptoJS.SHA256(txInContent + txOutContent + tx.timestamp).toString();
};

const findUTxOut = (txOutId, txOutIndex, uTxOutList) => {
  return uTxOutList.find(
    uTxO => uTxO.txOutId === txOutId && uTxO.txOutIndex === txOutIndex
  );
};

const signTxIn = (tx, txInIndex, privateKey, uTxOutList) => {
  const txIn = tx.txIns[txInIndex];
  const dataToSign = tx.id;
  const referencedUTxOut = findUTxOut(txIn.txOutId, tx.txOutIndex, uTxOutList);

  if (referencedUTxOut === null) {
    console.log('Could not find the referenced uTxOut, not signing');
    return;
  }

  const referencedAddress = referencedUTxOut.address;
  if(getPublicKey(privateKey) !== referencedAddress) {
    return false;
  }

  const key = ec.keyFromPrivate(privateKey, 'hex');
  const signature = utils.toHexString(key.sign(dataToSign).toDER());
  return signature;
};

const getPublicKey = privateKey => {
  return ec
    .keyFromPrivate(privateKey, 'hex')
    .getPublic()
    .encode('hex');
};

const updateUTxOuts = (newTxs, uTxOutList) => {
  const newUTxOuts = newTxs.map(tx => {
    tx.txOuts.map((txOut, index) => {
      new UTxOut(tx.id, index, txOut.address, txOut.amount);
    });
  })
  .reduce((a, b) => a.concat(b), []);

  const spentTxOuts = newTxs
    .map(tx => tx.txIns)
    .reduce((a, b) => a.concat(b), [])
    .map(txIn => new UTxOut(txIn.txOutId, txIn.txOutIndex, '', 0));

  const resultingUTxOuts = uTxOutList
    .filter(uTxO => !findUTxOut(uTxO.txOutId, uTxO.txOutIndex, spentTxOuts))
    .concat(newUTxOuts);
  
    return resultingUTxOuts;
};

/*
  [(), B, C, D, E, F, G, ZZ, MM]

  A(40) ---> TRANSACTION ----> ZZ(10)
                         ----> MM(30)
*/

const isTxInStructureValid = txIn => {
  if(txIn === null) {
    console.log('The txIn appears to be null');
    return false;
  } else if(typeof txIn.signature !== 'string') {
    console.log('The TxIn does not have a valid signature')
    return false;
  } else if(typeof txIn.txOutId !== 'string') {
    console.log('The txIn does not have a vliad txOutId');
    return false;
  } else if(typeof txIn.txOutIndex !== 'number') {
    console.log('The txIn does not have a valid txOutIndex');
    return false;
  } else {
    return true;
  }
};

const isAddressValid = address => {
  if(address.length !== 130) {
    console.log('The address length is not the expected one');
    return false;
    // Hexadecimal Pattern
  } else if(address.match('^[a-fA-F0-9]+$') === null){
    console.log('The address does not match the hex pattern');
    return false;
  } else if(!address.startsWith('04')) {
    console.log('The address does not start with 04');
    return false;
  } else {
    return true;
  }
};

const isTxOutStructureValid = txOut => {
  if(txOut === null) {
    console.log('The txOut appears to be null');
    return false;
  } else if(typeof txOut.address !== 'string') {
    console.log('The txOut does not have a valid string as address');
    return false;
  } else if (!isAddressValid(txOut.address)) {
    console.log('The txOut does not have a valid address');
    return false;
  } else if(typeof txOut.amout !== 'number') {
    console.log('The txOut does not have a valid amount');
    return false;
  } else {
    return true;
  }
};

const isTxStructureValid = tx => {
  if(typeof tx.id !== 'string') {
    console.log('Tx ID is not valid');
    return false;
  } else if(!(tx.txIns instanceof Array)) {
    console.log('The txIns are not an array');
    return false;
  } else if(!tx.txIns.map(isTxInStructureValid).reduce((a, b) => a && b, true)) {
    console.log('The structure of one of the txIn is not valid');
    return false;
  } else if(!(tx.txOuts instanceof Array)) {
    console.log('The txOuts are not an array');
    return false;
  } else if(!tx.txOuts.map(isTxOutStructureValid).reduce((a, b) => a && b, true)) {
    console.log('The structure of one of the txOut is not valid');
  } else {
    return true;
  }
};

const validateTxIn = (txIn, tx, uTxOutList) => {
  const wantedTxOut = uTxOutList.find(uTxO => uTxO.txOutId === txIn.txOutId && uTxO.txOutIndex === txIn.txOutIndex);
  if(wantedTxOut === null) {
    console.log(`Did not find the wanted uTxOut, the tx: ${tx} is invalid`);
    return false;
  } else {
    const address = wantedTxOut.address;
    const key = ec.keyFromPublic(address, 'hex');
    return key.verify(tx.id, txIn.signature);
  }
};

const getAmountInTxIn = (txIn, uTxOutList) => 
  findUTxOut(txIn.txOutId, txIn.txOutIndex, uTxOutList).amount;

const validateTx = (tx, uTxOutList) => {
  if(!isTxStructureValid) {
    console.log('Tx structure is invalid!');
    return false;
  }

  if(getTxId(tx) !== tx.id) {
    console.log('Tx Id is not valid');
    return false;
  }

  const hasValidTxIns = tx.txIns.map(txIn => 
    validateTxIn(txIn, tx, uTxOutList));

  if(!hasValidTxIns) {
    console.log(`The tx: ${tx} doesn't have valid txIns`);
    return false;
  }

  const amountInTxIns = tx.txIns
    .map(txIn => getAmountInTxIn(txIn, uTxOutList))
    .reduce((a, b) => a + b, 0);

  const amountInTxOuts = tx.txOuts
    .map(txOut => txOut.amount)
    .reduce((a, b) => a + b, 0);

  if(amountInTxIns !== amountInTxOuts) {
    console.log(`The tx: ${tx} doesn't have the same amount in the txOut as in the txIns`)
    return false;
  } else {
    return true;
  }
};

const validateCoinbaseTx = (tx, blockIndex) => {
  if(getTxId(tx) !== tx.id) {
    console.log('Invalid Coinbase tx ID');
    return false;
    // It comes from one blockchain
  } else if(tx.txIns.length !== 1) {
    console.log('Coinbase Tx should only have one input');
    return false;
  } else if(tx.txIns[0].txOutIndex !== blockIndex) {
    console.log('The txOutIndex of the Coinbase Tx should be the same as the Block Index');
    return false;
    // b/c miner is only one person
  } else if(tx.txOuts.length !== 1) {
    console.log('Coinbase Tx should only have one output');
    return false;
  } else if(tx.txOuts[0].amount !== COINBASE_AMOUNT) {
    console.log(`Coinbase Tx should have an amount of only ${COINBASE_AMOUNT} and it has ${tx.txOuts[0].amount}`);
    return false;
  } else {
    return true;
  }
};

const createCoinbaseTx = (address, blockIndex) => {
  const tx = new Transaction();
  const txIn = new TxIn();
  txIn.signature = '';
  txIn.txOutId = blockIndex;
  tx.txIns = [txIn];
  tx.txOuts = [new TxOut(address, COINBASE_AMOUNT)];
  tx.id = getTxId(tx);
  return tx;
};

module.exports = {
  getPublicKey,
  getTxId,
  signTxIn,
  TxIn,
  TxOut,
  createCoinbaseTx,
};
