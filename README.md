# EtherSerial
[![Build Status](https://travis-ci.org/yakmoose/etherserial.svg?branch=master)](https://travis-ci.org/yakmoose/etherserial)

EtherSerial is a transport layer that works in conjunction with [Firmata.js](https://github.com/firmata/firmata.js) to enable
communication with serial devices over ethernet using tools such as [ser2net](http://ser2net.sourceforge.net/), or the
[pySerial bridge examples](https://pythonhosted.org/pyserial/examples.html#tcp-ip-serial-bridge) (It does not, at this point support RFC2217).


This work is based on [Rick Waldron's EtherPort](https://github.com/rwaldron/etherport) for ethernet/wifi enabled Arduino devices.



## Setup
The primary purpose for this is to allow you to connect to devices running Firmata that do not have their own ethernet,
 but are tethered to something that does. This allows you to run Firmata.js or [Johnny-Five](http://johnny-five.io/) on a different machine.

Firstly you will need an Arduino running Standard Firmata, this ships with the latest version of the Arduino IDE.

You will also need to install an application such as ser2net or the pySerial serial bridge (These are the only serial redirectors
that have been tested).


```js
var five = require("../lib/johnny-five.js");
var EtherSerial = require('etherserial');
var board = new five.Board({
    port: new EtherSerial({
            port: 3030,
            host: "localhost"
    })
});

board.on("ready", function() {
  var led = new five.Led(9);
  led.blink(500);
});
```


## Compatible Shields & Boards

The following shields are those that have been tested and confirmed to work correctly with Etherserial + Firmata.js + Johnny-Five.


- [Raspberry PI](https://www.raspberrypi.org/) and [Freetronics Pileven](https://www.freetronics.com.au/products/pileven-arduino-compatible-expansion-for-raspberry-pi)


## License
This project is based on EtherPort by Rick Waldron, and is licensed under the same terms. See LICENSE-MIT file.