import * as dgram from "dgram";
import {
  composePacket,
  PacketID,
  parsePacket,
  PayloadID,
} from "amongus-protocol";
import { Packet } from "amongus-protocol/js/lib/interfaces/Packets.js";

interface Server {
  ip: string;
  port: number;
}

type InterceptHandler = (packet: Packet) => Packet | void;

export class AmongUsProxy {
  private remoteSocket: dgram.Socket;
  private remoteServer: Server;

  private localSocket: dgram.Socket;
  private localServer: Server;
  private localClientPort?: number;

  private nextServer?: Server;

  private interceptHandlers: InterceptHandler[] = [];

  constructor(ip: string, port: number) {
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
        if (packet.op === PacketID.Hello) {
          if (this.nextServer) {
            const oldServer = this.remoteServer;
            this.remoteServer = this.nextServer;
            this.nextServer = oldServer;
          }

          return;
        }
      } else {
        if (
          packet.op === PacketID.Unreliable ||
          packet.op === PacketID.Reliable
        ) {
          //Handle a server redirect, works by overwriting the redirect to keep the client on the localhost
          //Then it saves the new server ip and port into a variable for us to connect to when the hello packet is being sent
          //We wait for the hello packet because the client is going to send a disconnect packet once it receives the redirect packet and that needs to go to the old server
          for (const payload of packet.payloads) {
            if (payload.payloadid === PayloadID.Redirect) {
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

  private sendToRemoteSocket(message: Buffer) {
    this.remoteSocket.send(
      message,
      this.remoteServer.port,
      this.remoteServer.ip
    );
  }

  private sendToLocalSocket(message: Buffer) {
    if (this.localClientPort) {
      this.localSocket.send(message, this.localClientPort, this.localServer.ip);
    }
  }

  private handleSocketMessage(message: Buffer, bound: "server" | "client") {
    let packet = parsePacket(message, bound);

    for (const intercept of this.interceptHandlers) {
      const newPacket = intercept(packet);
      if (newPacket) {
        packet = newPacket;
      }
    }

    const composedPacket = composePacket(packet, packet.bound);
    if (packet.bound === "server") {
      this.sendToRemoteSocket(composedPacket);
    } else {
      this.sendToLocalSocket(composedPacket);
    }
  }

  addPacketIntercept(handler: InterceptHandler) {
    this.interceptHandlers.push(handler);
  }

  removePacketIntercept(handler: InterceptHandler) {
    this.interceptHandlers = this.interceptHandlers.filter(
      (e) => e !== handler
    );
  }

  listen(callback?: () => void) {
    if (callback) {
      this.localSocket.on("listening", callback);
    }

    this.localSocket.bind(this.localServer.port, this.localServer.ip);
  }
}
