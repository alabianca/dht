const Contact = require('./contact');
/**
 * 
 * @param {NodeId} ownId 
 * @param {number} index 
 */
function KBucket(ownId, index) {
    this.length = 0;
    this._data = [];
    
}

//statics
KBucket.CAPACITY = 20;

KBucket.prototype.getHead = function() {
    return this._data[0];
}
KBucket.prototype.getTail = function() {
    return this._data[this._data.length-1];
}

/**
 * 
 * @param {Contact} data 
 * Adding a new node to the bucket contains the following steps: 
 *  1. If Bucket contains less than CAPACITY nodes and node does not already exist - add node to tail
 *  2. If Bucket contains node already, the node is moved to the tail of the list
 *  3. If Bucket contains CAPACITY, the node at the head is pinged. If it replies, the current head is moved 
 *     to the tail and the contact is not added. If it does not reply, the head is discarded and the contact is
 *     added to the tail
 * @Source: Implementation of the Kademlia Distributed Hash Table by Bruno Spori Semester Thesis
 * 
 */
KBucket.prototype.add = function(contact, pingFunc, callback) {
    // 2.
    if(this._contains(contact)) {
        this.moveToTail(contact);
        process.nextTick(() => callback(true));
        return;
    }
    // 1. 
    if(this._data.length < KBucket.CAPACITY) {
        this.addToTail(contact);
        process.nextTick(() => callback(true));
        return;
    }
    // 3.
    pingFunc(this.getHead(), (responded) => {
        if(responded) {
            const head = this._data.splice(0,1);
            this._data.push(...head);
            callback(false);
            return;
        }

        this._data.splice(0,1);
        this.addToTail(contact);
        callback(true);
        return;
    });
    
}

/**
 * 
 * @param {Contact} contact Contact is simply added to tail. No check on size of bucket is done ...
 */
KBucket.prototype.addToTail = function(contact) {
    this._data.push(contact);
}

/**
 * @param {Contact} contact moves the provided contact to the tail of the list
 */
KBucket.prototype.moveToTail = function(contact) {
    let index = 0;
    //first find the index of the contact
    for(let i = 0; i < this._data.length; i++) {
        if(contact.getId().equal(this._data[i].getId())) {
            index = i;
            break;
        }
    }
    //next move the index to the tail by splicing
    const c = this._data.splice(index,1);
    this._data.push(...c);

}

/**
 * 
 * @param {Contact} contact 
 * @returns {boolean} returns true if Kbucket contains id already
 */
KBucket.prototype._contains = function(contact) {
    const otherId = contact.getId();

    for(let i = 0; i < this._data.length; i++) {
        if(otherId.equal(this._data[i].getId())) {
            return true;
        }
    }
    return false;
}

KBucket.prototype.size = function() {
    return this._data.length;
}

KBucket.prototype.getList = function() {
    return this._data;
}

module.exports = KBucket;
