const {NodeId} = require('./id');
const Contact  = require('./contact');

function RpcAdapter(address,port) {
    this._address = address;
    this._port = port;
    this._tasks = new TaskQueue(RpcAdapter.CONCURRENCY);
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
        return resolve();
    })
}

RpcAdapter.prototype.RPC_store = function() {}
RpcAdapter.prototype.RPC_ping = function() {}
RpcAdapter.prototype.RPC_findValue = function() {}

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

RpcAdapter.prototype.getAddress = function() {
    return this._address;
}

RpcAdapter.prototype.getPort = function() {
    return this._port;
}







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