const {NodeId} = require('./id');
const KBucket = require('./k-bucket');
const Contact = require('./contact');
const RpcAdapter = require('./rpcAdapter');
const DHT = require('./dht');

const address = process.argv[2]; //remote address of gateway
const port = process.argv[3]; //remote port of gateway
const gatewayId = process.argv[4]; //remote id of gateway

const adapter = new RpcAdapter("127.0.0.1", 5454); //local 


const id = NodeId.fromHash(gatewayId);
const gateway = new Contact(id,address+":"+port);

const dht = DHT.bootstrap(adapter,gateway);



