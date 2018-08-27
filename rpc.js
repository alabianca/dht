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

    _enqueueFindNode(ip,port,nodeId) {
        const task = this.RPC_findNode.bind(this,ip,port,nodeId);
        this._tasks.pushTask(task);
    }

    /**
     * 
     * @param {*} msg 
     * @param {*} remote {port,address}
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
    0: "FIND_NODE",
    1: "STORE",
    2: "PING",
    3: "FIND_VALUE"
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