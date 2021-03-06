const {NodeId}     = require('./id');
const RoutingTable = require('./routingTable');
const Contact      = require('./contact');
const ShortList    = require('./shortList');
const LookupList   = require('./lookupList');
const Utils        = require('../util/util');
const crypto       = require('crypto');
const NodeLookup   = require('./events/nodeLookupEmitter');
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
    //RPC event emitters
    this.nodeLookupEmitter = NodeLookup(rpcAdapter);
    //this.nodeLookupEmitter.on('complete', this._onNodeLookupComplete.bind(this));
    //event listeners
    this._rpc.onFindNode(this._onFindNodes.bind(this));
    this._rpc.onResponse(this._onRpcResponse.bind(this));
}

//statics
DHT.ALPHA       = 3; // concurrency limit
DHT.K           = 20;
DHT.NODE_LOOKUP = 0;


/**
 * @param {Contact} [gateway] optional gateway
 * @param {*} rpcAdapter
 * @param {Function} bootstrapped
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
        console.log(this._routingTable.toString())
        //find closest nodes to looked up nodeId.
        //filter out the nodeId in the results.
        //TODO: filter out the nodeId in findNodes to be more efficient.
        let contacts = this._routingTable.findNodes(id,DHT.K)
                                           .filter(c => !c.getId().equal(contact.getId()));
        
        const response = {
            host:     data.payload.remoteAddress,
            port:     data.payload.remotePort,
            node:   {
                id: this._id,
                host: this._address,
                port: this._port
            },
            contacts: contacts
        }

        this._rpc.respond(DHT.NODE_LOOKUP, response);

    })
    
}

/**
 * 
 * @param {*} data data that is returned from an RPC. Data should always contain a 'type' property to indicate
 * what type of response it is. For example if it is a response as a result from a FIND_NODE RPC. Each action is different
 * data should always also contain a node property which is the senders triplet (nodeId [hex], host, port)
 */
DHT.prototype._onRpcResponse = function(data) {
    const id = NodeId.fromHash(data.node.id); //the senders nodeId
    const contact = new Contact(id, data.node.host + ":" + data.node.port);

    this.store(contact, ()=>{
        console.log('Attempted to store responder ..');
        console.log('Responder: ', contact.getId().toString('hex'));
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
        console.log('Stored Gateway: ' + gateway.getId().toString('hex'));
        this._nodeLookup(this._id,()=>{
            // 3. do node lookups for all k-buckets with higher index than the one of the lowest non empty bucket
            let ids = [];
            let index = 0;
            // find index of first non empty bucket +1
            for(let i = 0; i < this._routingTable._kbuckets.length; i++) {
                if(this._routingTable._kbuckets[i].length > 0) {
                    index = i;
                    break;
                }
            }
            this._routingTable._kbuckets.slice(index).forEach((bucket)=>{
                let i = bucket._data.map(contact => contact.getId());
                ids = [...ids, ...i];
            });

            this._sequentialNodeLookup(ids)
                .then((resolve)=>{
                    //finally return back to caller. bootstrapping is done
                    done();
                })
        });
    });
}

/**
 * 
 * @param {NodeId} nodeId id to be looked up
 * Kicks off the node lookup procedure
 */
DHT.prototype._nodeLookup = function(nodeId,cb) {
    // 1. find ALPHA nodes in routing table closest to id
    const alphaNodes = this._routingTable.findNodes(nodeId,DHT.ALPHA);
    // 2. Store in short list && and enqueue
    this.nodeLookupEmitter.once('complete', (neighbors)=>{
        this._onNodeLookupComplete(neighbors,()=>{
            cb();
        })
    })
    this.nodeLookupEmitter.start(nodeId, alphaNodes);    
}

/**
 * 
 * @param {[NodeId]} nodeIds 
 */
DHT.prototype._sequentialNodeLookup = function(nodeIds) {
    const self = this;

    const promise = new Promise((resolve,reject)=>{

        function iterate(index) {
            if(index === nodeIds.length) {
                return resolve();
            }

            const id = nodeIds[index];
            console.log('Sequential Node Lookup for: ', id.toString('hex'));
            self._nodeLookup(id,()=>{
                iterate(index+1);
            });
        }

        iterate(0);
    });

    return promise;
}


/**
 * 
 * @param {Object} data {nodes: [queried:bool,answered:bool,contact:Contact]}
 */
DHT.prototype._onNodeLookupComplete = function(data,cb) {
    const self  = this;
    const nodes = data.nodes;
    function iterate(index) {
        if(index === nodes.length) {
            console.log('Lookup Complete');
            console.log(self._routingTable.toString());
            return cb();
        }

        self.store(nodes[index].contact, ()=>{
            iterate(index+1);
        });
    }

    iterate(0);
}

DHT.prototype.sendPing = function(contact,onResponse) {
    console.log('Need to send ping');
    //this will the the pinging of the rpc
    setTimeout(()=>{
        onResponse(true);
    },200)
}




module.exports = DHT;