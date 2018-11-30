const crypto = require('crypto');
const {NodeId} = require('../id');

/**
 *   1 Byte           20 Bytes            20 Bytes              Message Dependent                  20 Bytes
 *  _______________________________________________________________________________________________________________
 * |             |                    |                  |                                  |                     |
 * | Demultiplex |  Sender Id         |  Echoed Random   |         Payload                  |     Random Id       |
 * |    Key      |                    |      ID          |                                  |                     |
 * |_____________|____________________|__________________|__________________________________|_____________________|
 * 
 * 
 */

module.exports = {
    encode: function(msg) {
        const demux = msg.type; //int or string
        const senderId = msg.senderId; //buffer
        const echoRandom = msg.echo; //buffer
        const p = msg.payload; 
        const randomId = crypto.randomBytes(20);

        const demuxKey = Buffer.allocUnsafe(1);
        demuxKey.writeInt8(parseInt(demux));

        const payload = Buffer.from(p);

        const length = demuxKey.length + senderId.length + echoRandom.length + randomId.length + payload.length;
        const message = Buffer.concat([demuxKey, senderId, echoRandom, payload, randomId], length);

        return message;



    },
    decode: function(buffer) {
        const payLoadEnd = buffer.length - 20;
        const msg = {};

        msg["type"] = buffer[0];

        const sender_buf  = buffer.slice(1,21).toString('hex');
        const echo_buf    = buffer.slice(21,41).toString('hex');
        const rand_id     = buffer.slice(payLoadEnd,buffer.length).toString('hex');
        msg["senderId"]   = NodeId.fromHash(sender_buf);
        msg["echo"]       = NodeId.fromHash(echo_buf);
        msg["randomId"]   = NodeId.fromHash(rand_id);


        return msg;

    }
}