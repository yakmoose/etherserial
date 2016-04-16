/**
 * Global Environment Dependencies
 */
/* jshint -W079 */
if (!Object.assign || !Map) {
    require("es6-shim");
}

var IS_TEST_ENV = global.IS_TEST_ENV || false;
var net = require("net");
var Emitter = require("events").EventEmitter;
var priv = new Map();

function EtherSerial(opts) {
    Emitter.call(this);

    if (typeof opts === "undefined") {
        throw new Error("Expected host or object");
    }

    opts.host = opts.host || "127.0.0.1";
    opts.port = opts.port || 3030;

    // Alias used in state.flushTo
    var etherserial = this;

    this.path = "Connecting to: " + opts.host + ":" +opts.port;
    this.name = "EtherSerial";

    var state = {
        queue: [],
        socket: null,
        flushTo: function(socket) {
            if (this.socket === null) {
                this.socket = socket;
                etherserial.emit("open");
            }
            if (this.queue.length) {
                this.queue.forEach(function(buffer) {
                    this.socket.write(buffer);
                }, this);

                this.queue.length = 0;
            }
        }
    };

    var client = new net.Socket();

    client.connect(opts.port, opts.host, function() {
        state.flushTo(client);
    }.bind(this));

    client.on("data", function (data){
        this.emit("data", data);
    }.bind(this));

    priv.set(this, state);
}

EtherSerial.prototype = Object.create(Emitter.prototype, {
    constructor: {
        value: EtherSerial
    }
});

EtherSerial.prototype.write = function(buffer) {
    var state = priv.get(this);

    if (state.socket === null) {
        state.queue.push(buffer);
    } else {
        state.socket.write(buffer);
    }
};


if (IS_TEST_ENV) {
    EtherSerial.__mock = function(mockNet) {
        if (!EtherSerial.__mock.net) {
            EtherSerial.__mock.net = net;
            net = mockNet;
        }
    };

    EtherSerial.__leak = function() {
        return priv;
    };

    EtherSerial.__reset = function() {
        net = EtherSerial.__mock.net;
        EtherSerial.__mock.net = null;
    };
}

module.exports = EtherSerial;


