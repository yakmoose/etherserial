global.IS_TEST_ENV = true;

var EtherSerial = require("../");
var Emitter = require("events").EventEmitter;
var sinon = require("sinon");

function restore(target) {
    for (var prop in target) {

        if (target[prop] != null && typeof target[prop].restore === "function") {
            target[prop].restore();
        }
        if (typeof target[prop] === "object") {
            restore(target[prop]);
        }
    }
}

var sendSocket = true;
var socket = new Emitter();

socket.write = function() {};
sinon.spy(socket, "write");
sinon.spy(socket, "on");
sinon.spy(socket, "emit");


// we are making all sorts of assumptions here around how many of these things are being created
// the socket event emitter / mock has been pulled out here so that we can access it from within the tests.
// as the socket is private in the etherserial
var net = {
    Socket: function () {

        socket.write.reset();
        socket.removeAllListeners();

        this.connect = function (host, port, callback){
            setImmediate(function(){
                callback.apply(null, arguments);
            });
        };
        this.write = function (){
            socket.write.apply(socket, arguments);
        };
        this.on = function () {
            socket.on.apply(socket, arguments);
        };
        this.emit = function () {
            socket.emit(socket, arguments);
        };
    }
};


exports["Connection"] = {
    setUp: function(done) {
        this.sandbox = sinon.sandbox.create();
        this.socket = this.sandbox.spy(net, "Socket");
        EtherSerial.__mock(net);
        done();
    },

    tearDown: function(done) {
        EtherSerial.__reset();
        this.sandbox.restore();
        done();
    },

    error: function(test) {
        test.expect(1);

        test.throws(function() {
            new EtherSerial();
        });

        test.done();
    },

    initialize: function(test) {
        test.expect(1);
        var etherport = new EtherSerial('127.0.0.1', 3030);
        test.equal(this.socket.callCount, 1);
        test.done();
    },

    etherportEmitsSocketOpen: function(test) {
        test.expect(1);

        var etherserial = new EtherSerial('127.0.0.1', 3030);

        etherserial.on("open", function() {
            test.ok(true);
            test.done();
        });
    },

    etherportEmitsSocketData: function(test) {
        test.expect(1);

        var etherserial = new EtherSerial('127.0.0.1', 3030);

        etherserial.on("data", function() {
            test.ok(true);
            test.done();
        });

        socket.emit("data");
    },

    etherportWriteThroughToSocket: function(test) {
        test.expect(5);

        var etherserial = new EtherSerial('127.0.0.1', 3030);
        var buffer = new Buffer([1, 1, 1, 1]);

        etherserial.on("open", function() {
            etherserial.write(buffer);

            test.equal(socket.write.callCount, 1);

            var written = socket.write.getCall(0).args[0];


            for (var i = 0; i < buffer.length; i++) {
                test.equal(buffer.readUInt8(i), written.readUInt8(i));
            }

            test.done();
        });
    },

    etherportWriteQueue: function(test) {
        test.expect(8);


        var etherport = new EtherSerial('127.0.0.1', 3030);
        var leakedPriv = EtherSerial.__leak();
        var state = leakedPriv.get(etherport);
        var buffer = new Buffer([1, 1, 1, 1]);

        test.equal(state.queue.length, 0);

        etherport.write(buffer);

        test.equal(state.queue.length, 1);
        test.equal(socket.write.callCount, 0);

        for (var i = 0; i < buffer.length; i++) {
            test.equal(buffer.readUInt8(i), state.queue[0].readUInt8(i));
        }

        state.socket = socket;

        etherport.write(buffer);

        test.equal(socket.write.callCount, 1);

        test.done();
    },

    etherportFlush: function(test) {
        test.expect(4);


        var etherport = new EtherSerial('127.0.0.1', 3030);
        var leakedPriv = EtherSerial.__leak();
        var state = leakedPriv.get(etherport);
        var buffer = new Buffer([1, 1, 1, 1]);

        test.equal(state.queue.length, 0);

        etherport.write(buffer);

        test.equal(state.queue.length, 1);

        state.flushTo(socket);

        test.equal(state.queue.length, 0);
        test.equal(socket.write.callCount, 1);

        test.done();
    }
};
