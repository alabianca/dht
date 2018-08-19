const {NodeId} = require('./id');
const KBucket = require('./k-bucket');
const Contact = require('./contact');

const id = NodeId.generateRandomId();
const bucket = new KBucket(id,0);
const c1 = new Contact(NodeId.generateRandomId(),null)
const c2 = new Contact(NodeId.generateRandomId(),null)
const c3 = new Contact(NodeId.generateRandomId(),null)
const c4 = new Contact(NodeId.generateRandomId(),null)
const c5 = new Contact(NodeId.generateRandomId(),null)
const c6 = new Contact(NodeId.generateRandomId(),null);

const target = NodeId.generateRandomId();

const contactsToAdd = [c1,c2,c3,c4,c5,c6];

function addContacts(contacts,done) {

    function iterate(index) {
        if(index === contacts.length) {
            return done();
        }

        bucket.add(contacts[index], null, (added)=>{
            iterate(index+1);
        });
    }

    iterate(0);
}

addContacts(contactsToAdd,()=>{
    console.log('All Contacts ...');
    bucket._data.forEach(c => console.log(c.toString()));
    console.log('------------------------------');

    const threeClosest = bucket.getXClosestNodes(target,1);

    console.log('Closest...');
    threeClosest.forEach(c => console.log(c.toString()));
})


