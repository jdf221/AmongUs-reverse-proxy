"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmongUsProxy = void 0;
const dgram = require("dgram");
const amongus_protocol_1 = require("amongus-protocol");
class AmongUsProxy {
    constructor(ip, port) {
        this.interceptHandlers = [];
        this.remoteSocket = dgram.createSocket("udp4");
        this.remoteServer = { ip: ip, port: port };
        this.localSocket = dgram.createSocket("udp4");
        this.localServer = { ip: "127.0.0.1", port: port };
        this.localSocket.on("message", (message, remote) => {
            this.localClientPort = remote.port;
            this.handleSocketMessage(message, "server");
        });
        this.remoteSocket.on("message", (message, remote) => {
            this.handleSocketMessage(message, "client");
        });
        this.addPacketIntercept((packet) => {
            if (packet.bound === "server") {
                if (packet.op === amongus_protocol_1.PacketID.Hello) {
                    if (this.nextServer) {
                        const oldServer = this.remoteServer;
                        this.remoteServer = this.nextServer;
                        this.nextServer = oldServer;
                    }
                    return;
                }
            }
            else {
                if (packet.op === amongus_protocol_1.PacketID.Unreliable ||
                    packet.op === amongus_protocol_1.PacketID.Reliable) {
                    //Handle a server redirect, works by overwriting the redirect to keep the client on the localhost
                    //Then it saves the new server ip and port into a variable for us to connect to when the hello packet is being sent
                    //We wait for the hello packet because the client is going to send a disconnect packet once it receives the redirect packet and that needs to go to the old server
                    for (const payload of packet.payloads) {
                        if (payload.payloadid === amongus_protocol_1.PayloadID.Redirect) {
                            this.nextServer = { ip: payload.ip, port: payload.port };
                            payload.ip = this.localServer.ip;
                            payload.port = this.localServer.port;
                            return packet;
                        }
                    }
                }
            }
        });
    }
    sendToRemoteSocket(message) {
        this.remoteSocket.send(message, this.remoteServer.port, this.remoteServer.ip);
    }
    sendToLocalSocket(message) {
        if (this.localClientPort) {
            this.localSocket.send(message, this.localClientPort, this.localServer.ip);
        }
    }
    handleSocketMessage(message, bound) {
        let packet = amongus_protocol_1.parsePacket(message, bound);
        for (const intercept of this.interceptHandlers) {
            const newPacket = intercept(packet);
            if (newPacket) {
                packet = newPacket;
            }
        }
        const composedPacket = amongus_protocol_1.composePacket(packet, packet.bound);
        if (packet.bound === "server") {
            this.sendToRemoteSocket(composedPacket);
        }
        else {
            this.sendToLocalSocket(composedPacket);
        }
    }
    addPacketIntercept(handler) {
        this.interceptHandlers.push(handler);
    }
    removePacketIntercept(handler) {
        this.interceptHandlers = this.interceptHandlers.filter((e) => e !== handler);
    }
    listen(callback) {
        if (callback) {
            this.localSocket.on("listening", callback);
        }
        this.localSocket.bind(this.localServer.port, this.localServer.ip);
    }
}
exports.AmongUsProxy = AmongUsProxy;
