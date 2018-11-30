const kpacket = require('./core/messages/k-packet');
const {NodeId} = require('./core/id');

const message = {
    type: 3,
    senderId: NodeId.generateRandomId()._buffer,
    echo:     NodeId.generateRandomId()._buffer,
    payload: "Hello World",

}

console.log(message.type);
console.log(message.senderId.toString('hex'));
console.log(message.echo.toString('hex'));
// console.log(message.randomId.toString('hex'));

const encoded = kpacket.encode(message);

const decoded = kpacket.decode(encoded);

console.log('AFTER DECODE');
console.log(decoded.type);
console.log(decoded.senderId.toString('hex'));
console.log(decoded.echo.toString('hex'));
console.log(decoded.randomId.toString('hex'));