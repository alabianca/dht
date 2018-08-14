const KBucket = require('./k-bucket');
const Contact = require('./contact');
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
 * @param {Contact} contact 
 */
RoutingTable.prototype.storeContact = function(contact, pingFunc, cb) {
    //const delta = this._id.distanceTo(contact);
    const distance = this._id.distanceTo(contact.getId());
    const bucketIndex = this._findKBucket(distance);
    const bucket = this._kbuckets[bucketIndex];
    bucket.add(contact, pingFunc, cb);
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

/**
 * 
 * @param {Number} index index of the bucket
 * @return {KBucket} k-bucket
 */
RoutingTable.prototype.getBucketAt = function(index) {
    return this._kbuckets[index];
}

RoutingTable.prototype.toString = function() {
    let s = "";

    for(let i = 0; i < this._kbuckets.length; i++) {
        if(this._kbuckets[i].size() === 0) {
            continue;
        }

        let ids = "";
        const data = this._kbuckets[i].getList();
        const l = data.length;
        for(let j = 0; j < data.length; j++) {
            ids = ids + data[j].getId().toString('hex') + " ";
        }

        s = s + `Bucket ${RoutingTable.SIZE - i} (${l}): [${ids}] \n`
    }

    return s;
}


module.exports = RoutingTable;