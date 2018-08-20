const crypto = require('crypto');
const {NodeId} = require('./id');
const DHT = require('./dht');
const Contact = require('./contact');


// function createHash(from) {
//     const hash = crypto.createHash('sha1');
//     hash.update(from);
//     return hash.digest();
// }
const other = NodeId.generateRandomId();
const other2 = NodeId.generateRandomId();
const other3 = NodeId.generateRandomId();
const other4 = NodeId.generateRandomId();

const c1 = new Contact(other, 'Hello');
const c2 = new Contact(other2, "World");
const c3 = new Contact(other3, "Hi");
const c4 = new Contact(other4, "There");
const c5 = new Contact(NodeId.generateRandomId(), "akdfj");
const c6 = new Contact(NodeId.generateRandomId(), "akjfdklajfkl");
const c7 = new Contact(NodeId.generateRandomId(), "dkfjksakk");
const c8 = new Contact(NodeId.generateRandomId(), "akldjfjalfjksajldkfjklafj");

const contacts = [c1,c2,c3,c4,c5,c6,c7,c8];

const dht1 = DHT.bootstrap();
//const dht2  = DHT.bootstrap(dht1._id);

function addContacts(contacts,done) {

    function iterate(index) {
        if(index === contacts.length) {
            console.log('Initialized DHT');
            console.log(dht1._routingTable.toString())
            return done();
        }

        dht1.store(contacts[index], (added)=>{
            iterate(index+1);
        });
    }

    iterate(0);
}

addContacts(contacts, ()=>{
    const dht2 = DHT.bootstrap(dht1._id);
})

//const dht = new DHT();
// for(let i = 0; i < 160; i++) {
//     const id = NodeId.generateRandomId();
//     const c = new Contact(id,"Contact:"+i);
//     dht.store(c);
// }
// let counter = 0;
// let id = setInterval(()=>{
//     counter++;
//     const id = NodeId.generateRandomId();
//     const c = new Contact(id,"Contact:"+counter);
//     dht.store(c);
//     if(counter == 160) {
//         clearInterval(id);
//     }
// },20)
// dht.store(c1);
// dht.store(c2);
// dht.store(c3);
// dht.store(c4);



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