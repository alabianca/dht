const {EventEmitter} = require('events');
const LookupList     = require('../lookupList');
const {NodeId}       = require('../id');
const Contact        = require('../contact');
const Utils          = require('../../util/util');


class NodeLookupEmitter extends EventEmitter {
    
    constructor(rpc) {
        super();
        this._lookupList = null;
        this._timerId    = null;
        this._rpc        = rpc;
        this._loosersMap = {};
        this._rpc.onResponse(this._responseHandler.bind(this));

    }

    setRPC(rpc) {
        this._rpc = rpc;
    }

    /**
     * 
     * @param {NodeId} lookupId 
     * @param {[Contact]} seeds 
     */
    start(lookupId, seeds) {
        this._lookupList = new LookupList(lookupId);
        seeds.forEach(contact => this._lookupList.add(contact));
        this._rpc.enqueue(NodeLookupEmitter.RPC_COMMAND, lookupId, ...this._lookupList.getXNodes(NodeLookupEmitter.ALPHA));
        this._timerId = this._lookupList._enquired.timer(this._onTimerDone.bind(this)) //starts the timer
    }

    _onTimerDone() {
        console.log('Timer Done')
        this._lookupList._enquired.nodes.forEach((node,index)=>{ //these are the nodes that have not responded in time
            this._loosersMap[node.contact.getId().toString('hex')] = node;
            
        });
        this._lookupList._enquired.nodes = [];
        
        this._lookupList._enquired.timer = null;

        if(this._hasEnough() || (this._queriedAll() && this._zeroTimers())) {
            this._complete();
        } else {
            this._doLookup();
        }
        
    }


    //only do something if the response type === FIND_NODE_R
    _responseHandler(rpcResponse) {
        if(rpcResponse.type != NodeLookupEmitter.TRIGGER) {
            return;
        }
        const id = NodeId.fromHash(rpcResponse.node.id);

        //check if the responder is part of the losers map
        // if it is. make sure to update the list accordingly
        // then we are able to remove the node from the losers list
        if(this._loosersMap[id.toString('hex')]) {
            const v =  this._loosersMap[id.toString('hex')];
            this._lookupList.update(v.contact, {answered:true});
            delete this._loosersMap[id.toString('hex')];
        } else {
            //remove the responder from the enquired list
            this._lookupList._enquired.nodes.forEach((v,index)=>{
                if(id.equal(v.contact.getId())) {
                    this._lookupList._enquired.nodes.splice(index,1);
                }
            });
            //if all nodes reponded before the timeout was done. cancel the timeout
            if(this._lookupList._enquired.nodes.length === 0) {
                clearTimeout(this._timerId);
                this._timerId = null;
            }
        }

        if(this._doBookkeeping(rpcResponse.contacts, rpcResponse.node)) {
            return;
        }

        //
        if(this._lookupList._enquired.nodes.length == 0) {
            this._doLookup();
        }

    }

    /**
     * 
     * @param {*} contacts contact triplets
     * @param {*} responder the node that responded
     */
    _doBookkeeping(contacts, responder) {
       
        this._markAsAnswered(responder.id,responder.host,responder.port);
        
        contacts.forEach((contact) => {
            const cId = NodeId.fromHash(contact.nodeId);
            const value = contact.remoteAddress + ":" + contact.remotePort;
            const c = new Contact(cId,value);
            this._lookupList.add(c);
        });

        //Determine wheter the node lookup is done of not
        //For the queried all ----> i will also need to considere timed out nodes
        if(this._hasEnough() || (this._queriedAll() && this._zeroTimers())) {
            this._complete();
            return true;
        }
        return false;

    }

    _doLookup() {
        this._rpc.enqueue(NodeLookupEmitter.RPC_COMMAND, this._lookupList._lookupId, ...this._lookupList.getXNodes(NodeLookupEmitter.ALPHA));

        this._timerId = this._lookupList._enquired.timer ? this._lookupList._enquired.timer(this._onTimerDone.bind(this)) :  null //starts the timer
        
    }

    //marks a value in the lookup list as anwered
    _markAsAnswered(id,address,port) {
        const responderId = NodeId.fromHash(id);
        const val         =  Utils.concatAddr_Port(address,port);
        const contact     = new Contact(responderId,val);
        const delta       = this._lookupList._lookupId.distanceTo(contact.getId());
        const v           = this._lookupList._list.get(delta);

        if(v) {
            v.answered = true;
        }
    }

    _hasEnough() {
        let counter  = 0;
        let complete = false;
        for(let key of this._lookupList._list) {
            const v = this._lookupList._list.get(key);
            if(v.queried && v.answered) {
                counter++;
            }

            if(counter === NodeLookupEmitter.K) {
                complete = true;
                break;
            }
        }

        return complete;
    }

    _queriedAll() {
        let all = true;

        for(let key of this._lookupList._list) {
            const v = this._lookupList._list.get(key);
            if(!v.queried) {
                all = false;
            }
        }
        return all;
    }

    _zeroTimers() {
        if(!this._lookupList._enquired.timer && this._lookupList._enquired.nodes.length == 0) {
            return true;
        }

        return false;
    }

    _complete() {
        let closestNodes = [];
        for(let key of this._lookupList._list) {
            const node = this._lookupList._list.get(key);
            
            if(node.queried && node.answered) {
                closestNodes.push(node);
            }
            
            if(closestNodes.length === NodeLookupEmitter.K) {
                break;
            }
        }

        this.emit("complete", {nodes:closestNodes});


    }
}

NodeLookupEmitter.RPC_COMMAND = 0;
NodeLookupEmitter.ALPHA       = 3;
NodeLookupEmitter.TRIGGER     = "FIND_NODE_R";
NodeLookupEmitter.K           = 20;


//provide a singelton
module.exports = function(rpc) {
    return new NodeLookupEmitter(rpc);
}