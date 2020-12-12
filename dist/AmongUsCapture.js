"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmongUsCapture = void 0;
const events_1 = require("events");
const AmongUsProxy_1 = require("./AmongUsProxy");
class AmongUsCapture extends events_1.EventEmitter {
    constructor(ip, port = 22023) {
        super();
        this.proxyInstance = new AmongUsProxy_1.AmongUsProxy(ip, port);
        this.proxyInstance.addPacketIntercept((packet) => {
            this.emit("packet", packet);
        });
    }
    start(callback) {
        this.proxyInstance.listen(callback);
    }
}
exports.AmongUsCapture = AmongUsCapture;
