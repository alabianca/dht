const {NodeId} = require('./id');
const RoutingTable = require('./routingTable');
const crypto = require('crypto');

function DHT() {
    this._id = NodeId.generateRandomId();
    this._routingTable = new RoutingTable(this._id);
}

/**
 * 
 * @param {ID} id 
 */
DHT.prototype.store = function(id) {
    this._routingTable.storeContact(id);
}





//private
function generateHash(from) {
}



module.exports = DHT;