const crypto   = require('crypto');
const Contact  = require('./contact');
const {NodeId} = require('./id');
/**
 * 
 * @param {NodeId} ownId
 * @todo IMPLEMENT _nodes AS A TREEMAP
 * THIS ENSURES QUICKER LOOKUP AND LESS MEMORY AND ENSURES MAP IS SORTED  
 */
function ShortList(ownId) {
    this._id = ownId;
    this._rounds = [];
    this._ids = [];
    this._nodes = {};
    this._target = null;
    this._lastAdd = null;
    this._current = null;
}

//statics
ShortList.K = 20;
ShortList.TIME_OUT = 2000;

/**
 * 
 * @param {NodeId} target the id we are looking up
 */
ShortList.prototype.setTargetId = function(target) {
    this._target = target;
}

/**
 * 
 * @param {Contact} node The contact to add
 * @param {number} round which round this node belongs to
 */
ShortList.prototype.add = function(node, round) {
    //prevent from adding myself to the list
    const key = node.getId().toString('hex');

    if(key == this._id.toString('hex')) {
        return;
    }

    if(!this._rounds[round]) {
        this._rounds[round] = [];
    }

    const isNewClosest = this._addToKNodes(node.getId());
    //somewhow marking that a new closest node is found
    this._rounds[round].push({
        sendTimeout: function() {
            const n = node;
            console.log('execute send timeout')
            setTimeout(()=>{
                console.log('Reached timeout for: ', n._id.toString('hex'));
            },ShortList.TIME_OUT)
        },
        node:node
    });
    if(isNewClosest) {
        this._updateAddStatus();
    }

    this._nodes[key] = {
        round: round,
        queried: false,
        node:node
    }

    console.log('----------------------------------------')
    console.log('Short List Data');
    console.log('Own Id: ', this._id.toString('hex'));
    console.log('Target Id: ', this._target.toString('hex'));
    console.log('Checksum 1: ', this._lastAdd);
    console.log('Checksum 2: ', this._current);
    console.log('Rounds: ', this._rounds);
    console.log('K Closest Ids so far: ');
    console.log(this._ids);
    console.log('Map of Nodes for lookups: ');
    console.log(this._nodes);
    console.log('----------------------------------------')
}

/**
 * 
 * @param {NodeId} nodeId the nodeId we are attempting to store as a 'k' closest node. returns true if added. false otherwise
 * @returns {boolean} if a new closest node was found within the first 'K' nodes
 * @todo change this to a binary insert
 */
ShortList.prototype._addToKNodes = function(nodeId) {
    const distanceToTarget = nodeId.distanceTo(this._target);

    let index = 0;
    let delta = this._ids[index] ? this._ids[index].distanceTo(this._target) : null;

    while( distanceToTarget.compareDistanceTo(delta) < 0 && index < this._ids.length ){
        index++;
        delta = this._ids[index].distanceTo(this._target);
    }

    //nodeId distance is larger than largest distance of K nodes. add at index, but does not count as a new cloest node
    if(index > ShortList.K-1) {
        this._ids = [...this._ids.slice(0,index), nodeId, ...this._ids.slice(index,this._ids.length)];
        this._ids.splice(this._ids.length-1,1);
        return false;
    }

    //best case: ids has not reached max yet and index reached the end of the list. 
    //simply add to the list
    if(index < ShortList.K-1 && !this._ids[index+1]){
        this._ids.push(nodeId);
        return true;
    }

    //trickier: the distance is somewhere in between. we need to shift down
    this._ids = [...this._ids.slice(0,index), nodeId, ...this._ids.slice(index,this._ids.length)];
    this._ids.splice(this._ids.length-1,1);

    return true;
    
}

ShortList.prototype._updateAddStatus = function() {
    this._lastAdd = this._current;
    this._current = crypto.randomBytes(20).toString('hex');
}

/**
 * 
 * @param {String} key 
 */
ShortList.prototype.remove = function(key) {
    delete this._nodes[key];
}

/**
 * 
 * @param {String} key 
 */
ShortList.prototype.markAsQueried = function(key) {
    if(this._nodes[key]) {
        this._nodes[key].queried = true;
    }
}

/**
 * @param {Number} x how many nodes to get from the list
 * @returns {[Contact]}
 */
ShortList.prototype.getXNodes = function(x) {
    const returnNodes = [];
    const timers = [];

    for(let i = 0; i<this._ids.length; i++) {
        const key = this._ids[i].toString('hex');
        if(!this._nodes[key].queried) {
            returnNodes.push(this._nodes[key].node);
            const timer = this._getTimerForRoundNode(this._rounds[this._nodes[key].round],key);
            console.log(typeof timer)
            timers.push(timer);
            this._nodes[key].queried = true; //mark the node as queried
            if(returnNodes.length === x) {
                timers.forEach((timer) => {
                    console.log('execute timers')
                    timer();
                }); //execute all timers
                return returnNodes;
            }
        }
    }
    timers.forEach((timer) => {
        console.log('execute timers')
        timer();
    }); //execute all timers
    return returnNodes;
}

ShortList.prototype.getNonQueriedNodes = function() {
    const returnNodes = [];

    for(let key in this._nodes) {
        if(!this._nodes[key].queried) {
            returnNodes.push(this._nodes[key].node);
        }
    }

    return returnNodes;
}

/**
 * 
 * @param {[round]} round 
 */
ShortList.prototype._getTimerForRoundNode = function(round, key) {
    return round
        .filter(n => n.node.getId().equal(this._nodes[key].node.getId()))
        .map(o => o.sendTimeout)[0];
}



module.exports = ShortList;