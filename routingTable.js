const KBucket = require('./k-bucket');
const NodeId = require('./id');

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

RoutingTable.prototype.storeContact = function(contact) {
    const delta = this._id.distanceTo(contact);
    const targetBucket = this._findKBucket(delta);
    console.log(targetBucket);
}

/**
 * 
 * @param {Buffer} distance 
 */
RoutingTable.prototype._findKBucket = function(distance) {
    print(distance)
    for(let i = 0; i < this._kbuckets.length; i++){
        const high = Math.pow(2,i+1);
        const buf = Buffer.allocUnsafe(distance.length);
        const res = high | distance;
        for(let j = 0; j < distance.length; j++) {
            
            // buf[j] = high | distance[j];
            // console.log(high + " " + distance[j] + " " + buf[j])
            // if(buf[j] > distance[j]) {
            //     return i;
            // }
        }
    }

    return null;
}


function print(distance) {
    let bits = "";
    for(let i = 0; i < distance.length; i++) {
        bits += distance[i].toString(2);
    }

    console.log(bits)
}



module.exports = RoutingTable;