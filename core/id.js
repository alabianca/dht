const crypto = require('crypto');

function NodeId(buffer) {
    this._buffer = buffer;
}

//statics
NodeId.SIZE = 20 // 160 Bits
NodeId.BIT_SIZE = 160 //how many bits in the id


NodeId.generateRandomId = function() {
    const randomBytes = crypto.randomBytes(NodeId.SIZE);
    return new NodeId(randomBytes);
}

/**
 * 
 * @param {String} hash default encoding is hex
 */
NodeId.fromHash = function(hash) {
    const buf = Buffer.from(hash,'hex');
    return new NodeId(buf);
}

NodeId.prototype.toString = function(mode) {
    if(mode === 'hex') {
        return this._buffer.toString('hex')
    }
    let bits = ""
    for(let i = 0; i < NodeId.SIZE; i++) {
        bits = bits + this._buffer[i].toString(2)
    }
    return bits;
    
}

/**
 * 
 * @param {NodeId} id
 * @returns {Distance} distance 
 */
NodeId.prototype.distanceTo = function(id) {
    if(!id instanceof NodeId) {
        throw new Error('id must be of type NodeId');
    }
    
    const res = Buffer.allocUnsafe(NodeId.SIZE);

    for(let i = 0; i < NodeId.SIZE; i++) {
        res[i] = this._buffer[i] ^ id._buffer[i]; // XOR 
        //console.log('XOR: ', res[i].toString(2) , this._buffer[i].toString(2), id._buffer[i].toString(2))
    }

    return new Distance(res);

}

/**
 * 
 * @param {NodeId} first 
 * @param {NodeId} second 
 * @returns 0 if distances are the same. 1 if first is 'closer', -1 if second is closer 
 */
NodeId.prototype.compareDistance = function(first,second) {

    for(let i = 0; i < NodeId.SIZE; i++) {
        const b1 = this._buffer[i] ^ first._buffer[i]; 
        const b2 = this._buffer[i] ^ second._buffer[i];

        if(b1 < b2) {
            return 1;
        }
        if(b1 > b2) {
            return -1;
        }
    }

    return 0;
}

NodeId.prototype.getBitAt = function(index) {
    if(index >= NodeId.BIT_SIZE) {
        throw new Error('Index Out of Range');
    }

    // 1. first task to determine in what byte the index falls
    //    divide index by 8 to get approximate buffer Index
    //    Bitwise OR the result with 0 to get the rounded down index
    //    Ex: index = 35
    //        index / 8 = 4.375 => in toString(2) 100.011
    //        Bitwise OR that 100.011 | 00000000 = 100 which is the same as 4
    //        
    const bufferIndex = (index / 8) | 0;
    
    // 2. Now that we know which byte in the buffer we need to get the correct bit within the byte
    //    We can do this by applying a bit mask
    const mask = (1 << (7 - (index % 8)));
    // 3. Now that we have the mask we can 'extract' the bit at the index with Bitwise AND
    const bit = this._buffer[bufferIndex] & mask;

    if(bit) {
        return 1;
    }

    return 0;
}

/**
 * 
 * @param {NodeId} other r
 * @returns true if Id is equal to 'other' id. False otherwise
 */
NodeId.prototype.equal = function(other) {

    for(let i = 0; i < NodeId.SIZE; i++) {
        if(this._buffer[i] != other._buffer[i]) {
            return false;
        }
    }
    return true;
}


/**
 * 
 * @param {Buffer} buf 
 */
function Distance(buf) {
    this._buf = buf;
}

/**
 * 
 * @param {Distance} other
 * @returns {Number} 0 if they are the same. 1 if other is 'larger', -1 if other is smaller 
 */
Distance.prototype.compareDistanceTo = function(other) {

    if(!other) {
        return -1;
    }

    for(let i = 0; i < this._buf.length; i++) {
        if(this._buf[i] > other._buf[i]) {
            return -1;
        }

        if(this._buf[i] < other._buf[i]) {
            return 1;
        }

    }

    return 0;
}

Distance.prototype.getBitAt = function(index) {
    if(index >= NodeId.BIT_SIZE) {
        throw new Error('Index Out of Range');
    }

    const bufferIndex = (index/8) | 0;
    const mask = 1 << (7 - (index % 8));
    const bit = this._buf[bufferIndex] & mask;

    if(bit) {
        return 1;
    }

    return 0;
}

Distance.prototype.getBuffer = function() {
    return this._buf;
}

Distance.prototype.toString = function() {
    return this._buf.toString('hex');
}

module.exports.NodeId = NodeId;
module.exports.Distance = Distance;