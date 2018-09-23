const {NodeId} = require('./core/id');
const KBucket = require('./core/k-bucket');
const Contact = require('./core/contact');
const RpcAdapter = require('./http/rpc');
const DHT = require('./core/dht');

const address = process.argv[2]; //remote address of gateway
const port = process.argv[3]; //remote port of gateway
const gatewayId = process.argv[4]; //remote id of gateway

const myAddr = process.argv[5];
const myPort = process.argv[6];

const adapter = new RpcAdapter(myAddr, myPort); //local 


const id = NodeId.fromHash(gatewayId);
const gateway = new Contact(id,address+":"+port);

DHT.bootstrap(adapter,gateway, (dht)=> {
    console.log('Initializing DHT... Finding closest neighbors');
    console.log('_____________________________________________');
    console.log(dht._routingTable.toString());
    console.log('<-------------------------------------------------->')
    console.log('Node is ready: ');
    console.log('Node ID: ' + dht._id.toString('hex'));
    console.log('IP: ' + dht._address);
    console.log('Port: ' + dht._port);
});



