const {NodeId}     = require('./id');
const RoutingTable = require('./routingTable');
const Contact      = require('./contact');
const ShortList    = require('./shortList');
const crypto       = require('crypto');

/**
 * 
 * @param {*} rpcAdapter 
 */
function DHT(rpcAdapter) {
    this._rpc = rpcAdapter;
    this._id = NodeId.generateRandomId();
    this._address = rpcAdapter.getAddress();
    this._port = rpcAdapter.getPort();
    this._routingTable = new RoutingTable(this._id);
    this._shortList = new ShortList(this._id);

    //event listeners
    this._rpc.onFindNode(this._onFindNodes.bind(this));
}

//statics
DHT.ALPHA       = 3; // concurrency limit
DHT.K           = 20;
DHT.NODE_LOOKUP = 0;


/**
 * @param {Contact} [gateway] optional gateway
 * @param {*} rpcAdapter
 * @todo provide a RPC Adapter as first agrument to be provided in DHT constructor
 */
DHT.bootstrap = function(rpcAdapter,gateway,bootstrapped) {
    if(typeof gateway === 'function' && !bootstrapped) { //async
        bootstrapped = gateway;
        process.nextTick(()=> bootstrapped(new DHT(rpcAdapter)));
        return;
    }
    if(!gateway) { //no id is provided. Will be only Node in network (sync)
        return new DHT(rpcAdapter);
    }

    const dht = new DHT(rpcAdapter);
    dht._doBootstrap(gateway,()=>{
        //bootstrapped
        process.nextTick(() => bootstrapped(dht))
    });

}

/**
 * 
 * @param {*} data {remoteAddress:string,remotePort:number,nodeId: string (hex value of nodeId to look up)}
 */
DHT.prototype._onFindNodes = function(data) {
    const id = NodeId.fromHash(data.payload.nodeId);
    const contact = new Contact(id,data.payload.remoteAddress + ":" + data.payload.remotePort);
    // Kademlia states that every incoming message (besides a Ping should result in an attempted store)
    this.store(contact, ()=>{
        const contacts = this._routingTable.findNodes(id,DHT.K);
    })
    
}

/**
 * 
 * @param {Contact} contact
 * @param {Function} done 
 */
DHT.prototype.store = function(contact, done) {
    this._routingTable.storeContact(contact, this.sendPing.bind(this), (added)=>{
        //console.log('Added: ', added);
        done()
    });

}

/**
 * 
 * @param {Contact} gateway
 * @param {Function} done 
 */
DHT.prototype._doBootstrap = function(gateway, done) {
    // 1. store gateway in appropriate k-bucket
    this.store(gateway, ()=> {
        // 2. do node lookup for own id
        this._nodeLookup(this._id);
        // 3. let caller know that initial initialization is complete. 
        done();
    });
}

/**
 * 
 * @param {NodeId} nodeId id to be looked up
 */
DHT.prototype._nodeLookup = function(nodeId) {
    // 1. find ALPHA nodes in routing table closest to id
    const alphaNodes = this._routingTable.findNodes(nodeId,DHT.ALPHA);
    console.log('Found Alpha Nodes')
    alphaNodes.forEach(c => console.log(c.toString()));
    // 2. Store in short list
    alphaNodes.forEach(contact => this._shortList.add(contact))
    // 3. Send FIND_NODE_RPC's to nodes
    this._rpc.enqueue(DHT.NODE_LOOKUP, nodeId, ...this._shortList.getXNodes(DHT.ALPHA));
    
}

DHT.prototype.sendPing = function(contact,onResponse) {
    
    //this will the the pinging of the rpc
    setTimeout(()=>{
        onResponse(true);
    },200)
}




module.exports = DHT;