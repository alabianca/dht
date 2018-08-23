const {NodeId} = require('./id');
const Contact  = require('./contact');
const dgram    = require('dgram');

function RpcAdapter(address,port) {
    this._address = address;
    this._port = port;
    this._tasks = new TaskQueue(RpcAdapter.CONCURRENCY);

    //set up socket to receive and send
    this._socket = dgram.createSocket('udp4');
    this._socket.on('message', this._onMessage.bind(this));
    this._socket.bind(port,address);
}

//statics
RpcAdapter.CONCURRENCY = 3;
RpcAdapter.COMMAND_MAPPINGS = {
    0: "FIND_NODE",
    1: "STORE",
    2: "PING",
    3: "FIND_VALUE"
}

/**
 * 
 * @param {String} ip 
 * @param {String} port 
 * @param {String} nodeId 
 * @returns {Promise}
 */
RpcAdapter.prototype.RPC_findNode = function(ip,port,nodeId) {
    return new Promise((resolve,reject)=>{
        console.log(ip);
        console.log(port);
        console.log(nodeId);
        const msg = "FIND_NODE: " + nodeId;
        this._send(msg,{port,address:ip}, ()=> resolve());
    })
}

RpcAdapter.prototype.RPC_store = function() {}
RpcAdapter.prototype.RPC_ping = function() {}
RpcAdapter.prototype.RPC_findValue = function() {}

/**
 * 
 * @param {Buffer} message 
 */
RpcAdapter.prototype._onMessage = function(message) {
    console.log(message.toString());
}

/**
 * 
 * @param {*} msg 
 * @param {*} remote {port,address}
 */
RpcAdapter.prototype._send = function(msg,remote, sent) {
    const buf = Buffer.from(msg);
    const l = buf.length;
    this._socket.send(buf,0,l,remote.port,remote.address,sent );
}


RpcAdapter.prototype.getAddress = function() {
    return this._address;
}

RpcAdapter.prototype.getPort = function() {
    return this._port;
}



/**
 * 
 * @param {Number} command which rpc command to map
 * @param {NodeId} payload 
 * @param  {...Contact} contacts arguments for the tasks. Usually a Contact's triplet. (IP, Port,nodeId)
 */
RpcAdapter.prototype.enqueue = function(command,payload,...contacts) {

    switch(command) {
        case 0: contacts.forEach(arg => this._enqueueFindNode(arg.getIP(), arg.getPort(), payload.toString('hex')));
            break;
    }
}

RpcAdapter.prototype._enqueueFindNode = function(ip,port,nodeId) {
    const task = this.RPC_findNode.bind(this,ip,port,nodeId);
    this._tasks.pushTask(task);
}






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



module.exports = RpcAdapter