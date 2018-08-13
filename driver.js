const crypto = require('crypto');
const {NodeId} = require('./id');
const DHT = require('./dht');
const Contact = require('./contact');


function createHash(from) {
    const hash = crypto.createHash('sha1');
    hash.update(from);
    return hash.digest();
}
const other = NodeId.generateRandomId();
const other2 = NodeId.generateRandomId();
const other3 = NodeId.generateRandomId();
const other4 = NodeId.generateRandomId();

const c1 = new Contact(other, 'Hello');
const c2 = new Contact(other2, "World");
const c3 = new Contact(other3, "Hi");
const c4 = new Contact(other4, "There");

const dht = new DHT();
dht.store(c1);
dht.store(c2);
// dht.store(c3);
// dht.store(c4);

setTimeout(()=> console.log(dht._routingTable.toString()), 5000);


// const hash = createHash('My Hash Value 1');
// const hash2 = createHash('My Hash Value 2');
// const hash3 = createHash('My hash value 3')

//const id = NodeId.fromHash(hash);
// const id2 = NodeId.fromHash(hash2);
// const id3 = NodeId.fromHash(hash3);

// const distance = id.distanceTo(id2);
// const compairson = id.compareDistance(id3,id2);
// console.log(compairson)

// const bit = id.getBitAt(1);
// console.log(bit)
// console.log('ID 1: ', id.toString());
// console.log('ID 2: ', id2.toString());
// console.log('-----------');
// console.log('Distance: ', distance.toString('hex'))