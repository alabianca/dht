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

KBucket.prototype.add = function(data) {
    this._data.push(data);
}

KBucket.prototype.size = function() {
    return this._data.length;
}

KBucket.prototype.getList = function() {
    return this._data;
}

module.exports = KBucket;
