# Among Us Reverse Proxy
Simple UDP reverse proxy server to intercept Among Us game packets.

## Example

You need to set your Among Us to use localhost as the server. Follow the instructions here: https://impostor.github.io/Impostor/

Use the IP `127.0.0.1`.
___
```javascript
import { AmongUsCapture } from "./AmongUsCapture";

// List of master servers: https://github.com/edqx/amongus-protocol/blob/master/ts/lib/constants/MasterServers.ts
const capture = new AmongUsCapture("66.175.220.120");

capture.proxyInstance.addPacketIntercept((packet) => {
    // This is a parsed packet object. packet.bound = "server" or "client"
    // http://thechimp.store/amongus-protocol/modules/_lib_interfaces_packets_.html
    console.log(packet);
    
    // You can modify the packet object and return it, or don't return anything (undefined) to do nothing to it
    return packet;
});

capture.start();
```

This is using the Packet parsing functions from [edqx/amongus-protocol](https://github.com/edqx/amongus-protocol).

## How?

We create a UDP socket on the local device and tell the Among Us game that `127.0.0.1` is the server it should connect to.

Then after the game sends it's first message to our server we save the local port the game's socket is using so we can send the game client messages later. We then send the message the game sent us on to one of the master Among Us servers.

The master server will send a reply and we will forward that onto the game's client.

That's the basis of how it works, we're simply a little script sitting in-between the game client and the game server.

There is one very important thing we have to handle though, and that is when the game client tries to join a game lobby. This is special because when the client tries to join a lobby the master server sends the game client a `redirect` packet with a new server IP. We have to intercept that packet and change the new IP to `127.0.0.1` so that we can keep the game client connected to our server.

We also save the new server's IP and port and after the game sends its disconnect message to the old server we change our proxy so that it sends the game's packets to the new server IP and port.