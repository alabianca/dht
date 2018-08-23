const {NodeId} = require('./id');

/**
 * 
 * @param {NodeId} id 
 * @param {*} value 
 */
function Contact(id,value) {
    this._id = id;
    this._value = value;
}

/**
 * @returns {NodeId} id
 */
Contact.prototype.getId = function() {
    return this._id;
}

Contact.prototype.getValue = function() {
    return this._value;
}

Contact.prototype.getIP = function() {
    const split = this._value.split(':');
    return split[0];
}

Contact.prototype.getPort = function() {
    const split = this._value.split(':');
    return split[1];
}

Contact.prototype.toString = function() {
    return this._id.toString('hex');
}

module.exports = Contact;