const Contact  = require('./contact');
const {NodeId} = require('./id');
/**
 * 
 * @param {NodeId} ownId 
 */
function ShortList(ownId) {
    this._id = ownId;
    this._nodes = {};
}

/**
 * 
 * @param {Contact} node The contact to add
 */
ShortList.prototype.add = function(node) {
    //prevent from adding myself to the list
    const key = node.getId().toString('hex');

    if(key == this._id.toString('hex')) {
        return;
    }

    this._nodes[key] = {
        queried: false,
        node:node
    }
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
 */
ShortList.prototype.getXNodes = function(x) {
    const returnNodes = [];
    const keys = Object.keys(this._nodes);

    for(let i = 0; i<keys.length; i++) {
        if(!this._nodes[keys[i]].queried) {
            returnNodes.push(this._nodes[keys[i]].node);

            if(returnNodes.length === x) {
                return returnNodes;
            }
        }
    }
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



module.exports = ShortList;