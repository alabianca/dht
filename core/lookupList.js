const btree    = require('btree-treemap');

const Contact  = require('./contact');
const {NodeId} = require('./id');

class LookupList {
    /**
     * 
     * @param {NodeId} lookupId 
     */
    constructor(lookupId) {
        this._enquired = {
            nodes: [],
            timer: null
        };
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

    /**
     * 
     * @param {*} x number of nodes you want returned
     * @returns {[Contact]} 
     */
    getXNodes(x) {
        const contacts = [];

        for(let key of this._list) {
            const val = this._list.get(key);
            if(!val.queried) {
                val.queried = true;
                contacts.push(val.contact);
                this._enquired.nodes.push(val);
            }
            if(contacts.length === x) {
                break;
            } 
        }
        if(contacts.length > 0) {
            this._enquired.timer = timer(LookupList.TIME_OUT);
        }
        

        return contacts;
        
    }


    /**
     * 
     * @param {Contact} contact 
     * @param {Object} query 
     */
    update(contact,query) {
        const delta = this._lookupId.distanceTo(contact.getId());
        const v     = this._list.get(delta);
        
        for(let key in query) {
            v[key] = query[key];
        }
    }
}

LookupList.TIME_OUT = 2000; // give a 'round' 2 seconds to respond before continuing


function timer(timeout) {
    let id = null;
    return function(cb) {
        id = setTimeout(()=>{
            cb();
        },timeout);
        return id;
    }
}


module.exports = LookupList;