const btree    = require('btree-treemap');

const Contact  = require('./contact');
const {NodeId} = require('./id');

class LookupList {
    /**
     * 
     * @param {NodeId} lookupId 
     */
    constructor(lookupId) {
        this._enquired = {};
        this._lookupId = lookupId;

        this._list     = new btree.Treemap((a,b)=> { //a,b are of type Distance
            for(let i = 0; i < a._buf.length; i++) {
                if(a._buf[i] > b._buf[i]) { //b is smaller;
                    return 1;
                }
                if(a._buf[i] < b._buf[i]) { //b is larger;
                    return -1;
                }
            }

            return 0; //they are equal
        });
    }


    /**
     * 
     * @param {Contact} contact 
     */
    add(contact) {
        const distance = contact.getId().distanceTo(this._lookupId);
        const value    = {
            queried : false,
            answered: false,
            contact : contact
        }

        this._list.put(distance,value);
    }
}


module.exports = LookupList;