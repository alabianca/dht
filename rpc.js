const {NodeId}       = require('./id');
const Contact        = require('./contact');
const dgram          = require('dgram');
const {EventEmitter} = require('events')


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
        console.log(message);
        const payload = JSON.parse(message.toString());
        const type = payload.type;
        console.log(payload)
        switch(type) {
            case "FIND_NODE": this.emit('FIND_NODE', payload);
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
     * @param {Buffer} nodeId 
     * @param {Buffer} payload 
     */
    _respond(ip,port,nodeId,payload) {
        return new Promise((resolve,reject)=>{
            const msg = Buffer.concat([nodeId,payload],nodeId.length + payload.length);
            this._send(msg,{address:ip,port,port}, ()=> resolve());
        });
    }

    _enqueueFindNode(ip,port,nodeId) {
        const task = this.RPC_findNode.bind(this,ip,port,nodeId);
        this._tasks.pushTask(task);
    }

    /**
     * 
     * @param {*} data {host,port,nodeId (Buffer),contacts (Buffer)}
     */
    _enqueueFindNodeResponse(data) {
        const task = this._respond.bind(this,data.host,data.port,data.nodeId,data.contacts);
        this._responseQueue.pushTask(task);
    }

    /**
     * 
     * @param {String | Buffer} msg 
     * @param {*} remote {port,address}
     */
    _send(msg,remote,sent) {
        let buf;
        let l;
        if(typeof msg === 'string') {
            buf = Buffer.from(msg);
            l = buf.length;
        } else {
            buf = msg;
            l = buf.length;
        }
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