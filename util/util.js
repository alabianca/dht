const {NodeId, Distance} = require('../core/id');

const Utils = {
    /**
     * @param {NodeId} nodeId
     */
    NodeIdToBinary: function(nodeId) {
        let res = "";
        
        for(let i = 0; i < NodeId.SIZE; i++) {
            let bits = nodeId._buffer[i].toString(2);
            let zeros = "";
            if(bits.length < 8) {
                const diff = 8 - bits.length;
                for(let j = 0; j<diff; j++) {
                    zeros += "0"
                }
            }
            bits = zeros + bits;
            res += bits;
        }

        return res;
    },

    /**
     * @param {Distance} delta
     */
    DistanceToBinary: function(delta) {
        let res = "";

        for(let i = 0; i < NodeId.SIZE; i++) {
            let bits = delta._buf[i].toString(2);
            let zeros = "";
            if(bits.length < 8) {
                const diff = 8 - bits.length;
                for(let j = 0; j<diff; j++) {
                    zeros += "0"
                }
            }
            bits = zeros + bits;
            res += bits;
        }

        return res;

    }
}

module.exports = Utils;