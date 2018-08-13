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

module.exports = Contact;