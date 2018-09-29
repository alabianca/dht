const crypto = require('crypto');

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
    decode: function() {}
}