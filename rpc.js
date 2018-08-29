const {NodeId}       = require('./id');
const Contact        = require('./contact');
const dgram          = require('dgram');
const {EventEmitter} = require('events')


/**
 * @todo do message encoding. I am passing the data to the Rpc via regular JS objects which is fine.
 * At the moment I am just turning them into json and stringifying them to send them via udp packets.
 * That is not feasable and I need to do message encoding to create defined packets for each type of message
 * For right now however I want to focus on making sure the DHT will be able to receive messages and do the
 * correct ops
 */
class RpcAdapter extends EventEmitter {

    constructor(address,port) {
        super();

        this._address = address;
        this._port = port;
        this._tasks = new TaskQueue(RpcAdapter.CONCURRENCY);
        this._responseQueue = new TaskQueue(RpcAdapter.CONCURRENCY);

        this._socket = dgram.createSocket('udp4');
        this._socket.on('message', this._onMessage.bind(this));
        this._socket.bind(port,address);
    }

    getAddress() {
        return this._address;
    }
    getPort() {
        return this._port;
    }

    /**
     * 
     * @param {String} ip 
     * @param {String} port 
     * @param {String} nodeId 
     * @returns {Promise}
     * @todo This is still high level. For local testing for now I am just sending stringified json. but that will need to change once I got the dht working for all rpcs
     */
    RPC_findNode(ip,port,nodeId) {
        return new Promise((resolve,reject)=>{
            const msg = JSON.stringify({
                type: "FIND_NODE", 
                payload: {
                    remoteAddress:this._address,
                    remotePort:this._port,
                    nodeId:nodeId
                }
            });
    
            this._send(msg,{port,address:ip}, ()=> resolve());
        })
    }

    RPC_store() {}
    RPC_ping() {}
    PRC_findValue() {}

    /**
     * 
     * @param {Buffer} message
     * @todo needs message decoding mechanism 
     */
    _onMessage(message) {
        const payload = JSON.parse(message.toString());
        const type = payload.type;

        switch(type) {
            case "FIND_NODE": this.emit('FIND_NODE', payload);
                break;
            case "FIND_NODE_R": this.emit('RESPONSE', payload);
                break;
        }
    }

    /**
     * 
     * @param {Function} handler 
     */
    onFindNode(handler) {
        this.on("FIND_NODE", handler);
    }
    /**
     * 
     * @param {Function} handler 
     */
    onResponse(handler) {
        this.on("RESPONSE", handler);
    }

    /**
     * 
     * @param {Number} command which rpc command to map
     * @param {NodeId} payload 
     * @param  {...Contact} contacts arguments for the tasks. Usually a Contact's triplet. (IP, Port,nodeId)
     */
    enqueue(command,payload, ...contacts) {
        switch(command) {
            case 0: contacts.forEach(arg => this._enqueueFindNode(arg.getIP(), arg.getPort(), payload.toString('hex')));
                break;
        }
    }

    /**
     * 
     * @param {Number} command which rpc command we are responding to
     * @param {*} payload an arbitiary object
     * Note: command => 0: FIND_NODE
     */
    respond(command,payload) {
        switch(command) {
            case RpcAdapter.COMMAND_MAPPINGS.FIND_NODE: this._enqueueFindNodeResponse(payload);
                break; 
        }
    }

    /**
     * 
     * @param {String} ip 
     * @param {Number} port 
     * @param {*} payload 
     * @todo message encoding
     */
    _respond(ip,port,payload) {
        return new Promise((resolve,reject)=>{
            const msg = JSON.stringify(payload);
            this._send(msg,{address:ip,port,port}, ()=> resolve());
        });
    }

    _enqueueFindNode(ip,port,nodeId) {
        const task = this.RPC_findNode.bind(this,ip,port,nodeId);
        this._tasks.pushTask(task);
    }

    /**
     * 
     * @param {*} data {host,port,nodeId (NodeId),contacts ([Contacts])}
     * @todo message encoding
     */
    _enqueueFindNodeResponse(data) {
        const mappedContacts = data.contacts.map((c) => { //create an array of triplets
            return {
                remoteAddress: c.getIP(),
                remotePort: c.getPort(),
                nodeId: c.getId().toString('hex')
            }
        });
        const payload = {
            type: "FIND_NODE_R",
            contacts:mappedContacts,
            node: {
                host:data.node.host,
                id: data.node.id.toString('hex'),
                port:data.node.port
            }
        }
        const task = this._respond.bind(this,data.host,data.port,payload);
        this._responseQueue.pushTask(task);
    }

    /**
     * 
     * @param {String | Buffer} msg 
     * @param {*} remote {port,address}
     * @todo this needs to just accept a Buffer in the future once msg encoding/decoding is implemented
     */
    _send(msg,remote,sent) {
        const buf = Buffer.from(msg);
        const l = buf.length;        
        this._socket.send(buf,0,l,remote.port,remote.address,sent );
    }


}

//statics
RpcAdapter.CONCURRENCY = 3;
RpcAdapter.COMMAND_MAPPINGS = {
    FIND_NODE: 0,
    STORE: 1,
    PING: 2,
    FIND_VALUE: 3
}

module.exports = RpcAdapter;


///TASK QUEUE////

/**
 * 
 * @param {Number} concurrency how many tasks are allowed to run concurrently
 */
function TaskQueue(concurrency) {
    this._concurrency = concurrency;
    this._running = 0;
    this._queue = [];
}

TaskQueue.prototype.pushTask = function(task) {
    this._queue.push(task);
    this.next();
}

TaskQueue.prototype.next = function() {
    while(this._running < this._concurrency && this._queue.length) {
        const task = this._queue.shift();
        task()
            .then((resolve)=>{
                this._running--;
                this.next()
            })
            .catch((err)=>{});
        
        this._running++;
    }
}