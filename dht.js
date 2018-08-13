const {NodeId} = require('./id');
const RoutingTable = require('./routingTable');
const Contact = require('./contact');
const crypto = require('crypto');

function DHT() {
    this._id = NodeId.generateRandomId();
    this._routingTable = new RoutingTable(this._id);
}

//statics
DHT.ALPHA  = 3; // concurrency limit

/**
 * 
 * @param {Contact} contact 
 */
DHT.prototype.store = function(contact) {
    this._routingTable.storeContact(contact, this.sendPing.bind(this), (added)=>{
        console.log('Added: ', added);
    });

}

DHT.prototype.sendPing = function(contact,onResponse) {
    console.log(this._id.toString('hex'));
    console.log(contact.getId().toString('hex'))
    //this will the the pinging of the rpc
    setTimeout(()=>{
        onResponse(false);
    },200)
}

//private
function generateHash(from) {
}



module.exports = DHT;