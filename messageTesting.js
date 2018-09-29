const kpacket = require('./core/messages/k-packet');
const {NodeId} = require('./core/id');

const message = {
    type: 3,
    senderId: NodeId.generateRandomId()._buffer,
    echo:     NodeId.generateRandomId()._buffer,
    payload: "Hello World",

}

const encoded = kpacket.encode(message);
console.log(encoded);
const demuxKey = encoded[0];
console.log('Demux Key: ', demuxKey);