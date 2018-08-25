const crypto = require('crypto');
const {NodeId} = require('./id');
const DHT = require('./dht');
const Contact = require('./contact');
const RpcAdapter = require('./rpc');

const rpc1 = new RpcAdapter("127.0.0.1", "7000")
//const rpc2 = new RpcAdapter("127.0.0.1", "5345");

const other = NodeId.generateRandomId();
const other2 = NodeId.generateRandomId();
const other3 = NodeId.generateRandomId();
const other4 = NodeId.generateRandomId();

const c1 = new Contact(other, '127.0.0.1:4500');
const c2 = new Contact(other2, "127.0.0.1:4501");
const c3 = new Contact(other3, "127.0.0.1:4502");
const c4 = new Contact(other4, "127.0.0.1:4503");
const c5 = new Contact(NodeId.generateRandomId(), "127.0.0.1:4504");
const c6 = new Contact(NodeId.generateRandomId(), "127.0.0.1:4505");
const c7 = new Contact(NodeId.generateRandomId(), "127.0.0.1:4506");
const c8 = new Contact(NodeId.generateRandomId(), "127.0.0.1:4507");


const contacts = [c1,c2,c3,c4,c5,c6,c7,c8];

const dht1 = DHT.bootstrap(rpc1);
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
    console.log('Node is ready: ');
    console.log('Node ID: ' + dht1._id.toString('hex'));
    console.log('IP: ' + dht1._address);
    console.log('Port: ' + dht1._port);
    //const gateway = new Contact(dht1._id,dht1._address + ":" + dht1._port); 
    //const dht2 = DHT.bootstrap(rpc2,gateway);
});

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