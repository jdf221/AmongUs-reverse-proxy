"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AmongUsCapture_1 = require("./AmongUsCapture");
// Should be one of Among Us' master servers:
// https://github.com/edqx/amongus-protocol/blob/master/ts/lib/constants/MasterServers.ts
const capture = new AmongUsCapture_1.AmongUsCapture("66.175.220.120");
capture.start();
