const KBucket = require('./k-bucket');
const {NodeId, Distance} = require('./id');

/**
 * 
 * @param {NodeId} id 
 */
function RoutingTable(id) {
    this._id = id;
    this._kbuckets = [];
    for(let i = 0; i < RoutingTable.SIZE; i++) {
        this._kbuckets.push(new KBucket(this._id,i));
    }
}
//statics
RoutingTable.SIZE = 160;

/**
 * 
 * @param {NodeId} contact 
 */
RoutingTable.prototype.storeContact = function(contact) {
    //const delta = this._id.distanceTo(contact);
    const distance = this._id.distanceTo(contact);
    const bucketIndex = this._findKBucket(distance);
    const bucket = this._kbuckets[bucketIndex];
    bucket.add(contact);
}

/**
 * 
 * @param {Distance} distance 
 */
RoutingTable.prototype._findKBucket = function(distance) {
    for(let i = 0; i < RoutingTable.SIZE; i++) {
        const bit = distance.getBitAt(i);

        if(bit > 0) {
            return i;
        }
    }
    return RoutingTable.SIZE - 1; //this will practically never happen unless the distance is 0 ... which would be the own node
    
}

RoutingTable.prototype.toString = function() {
    let s = "";

    for(let i = 0; i < this._kbuckets.length; i++) {
        if(this._kbuckets[i].size() === 0) {
            continue;
        }

        let ids = "";
        const data = this._kbuckets[i].getList();

        for(let j = 0; j < data.length; j++) {
            ids = ids + data[j].toString() + " ";
        }

        s = s + `Bucket ${i}: [${ids}] \n`
    }

    return s;
}


module.exports = RoutingTable;