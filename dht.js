const {NodeId} = require('./id');
const RoutingTable = require('./routingTable');
const Contact = require('./contact');
const crypto = require('crypto');

function DHT() {
    this._id = NodeId.generateRandomId();
    this._routingTable = new RoutingTable(this._id);
}

//statics
DHT.ALPHA  = 3; // concurrency limit

/**
 * @param {NodeId} [nodeId] optional gateway
 * @todo provide a RPC Adapter as first agrument to be provided in DHT constructor
 */
DHT.bootstrap = function(nodeId) {
    if(!nodeId) { //no id is provided. Will be only Node in network
        return new DHT();
    }
    console.log(nodeId.toString('hex'))
    const dht = new DHT();
    dht._doBootstrap(nodeId,()=>{
        //bootstrapped
    });

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
 * @param {NodeId} nodeId
 * @param {Function} done 
 */
DHT.prototype._doBootstrap = function(nodeId, done) {
    const gateway = new Contact(nodeId,null);

    // 1. store gateway in appropriate k-bucket
    this.store(gateway, ()=> {
        // 2. do node lookup for own id
        this._nodeLookup(this._id);
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
    // 2. Send FIND_NODE_RPC's to nodes
}

DHT.prototype.sendPing = function(contact,onResponse) {
    
    //this will the the pinging of the rpc
    setTimeout(()=>{
        onResponse(true);
    },200)
}




module.exports = DHT;