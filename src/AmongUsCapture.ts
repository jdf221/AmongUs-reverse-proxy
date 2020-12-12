import { EventEmitter } from "events";
import { AmongUsProxy } from "./AmongUsProxy";
import { Packet } from "amongus-protocol/js/lib/interfaces/Packets.js";

export declare interface AmongUsCapture {
  on(event: "packet", listener: (packet: Packet) => void): this;
  on(event: "game", listener: (game: any) => void): this;
}

export class AmongUsCapture extends EventEmitter {
  readonly proxyInstance: AmongUsProxy;

  constructor(ip: string, port: number = 22023) {
    super();

    this.proxyInstance = new AmongUsProxy(ip, port);

    this.proxyInstance.addPacketIntercept((packet) => {
      this.emit("packet", packet);
    });
  }

  start(callback?: () => void) {
    this.proxyInstance.listen(callback);
  }
}
