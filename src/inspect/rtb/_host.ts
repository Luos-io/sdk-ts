import SerialPort from 'serialport';

import { defaultSerialOptions, serialPortUtils } from 'utils/index';
import { logger } from 'utils/logger';

import {
  IRTB,
  RTBData,
  RTBMode,
  RTBNode,
  RTBService,
  RTBServiceAccess,
} from './interfaces';

/**
 * @description Parse the RTB response and detect the first mode
 * @param rtb : RTB response
 * @returns RTBMode
 */
const parseMode = (rtb: Buffer): RTBMode => rtb.readUInt8(0);

/**
 * @description Parse a node from the RTB response
 * @param rtb : Slice of the RTB response containing the node details
 * @returns RTBNode
 */
const parseNode = (rtb: Buffer): RTBNode => {
  const ID = rtb.readUInt16LE(0) & 0xfff;
  const certificate = rtb.readUInt16LE(0) >> 12 === 1;
  const portTableBuffer = rtb.slice(2, 18 + 3); // TEMP 3 unknown bytes

  // TO TEST with multiple ports cards
  const portTable = portTableBuffer.reduce((acc, v, i) => {
    if (v !== 0) {
      if (i % 2 === 0) {
        acc.push(v);
      } else {
        acc[acc.length - 1] = acc[acc.length - 1] | (v << 8);
      }
    }
    return acc;
  }, [] as number[]);

  return {
    ID,
    certificate,
    portTable,
    services: [],
  };
};

/**
 * @description Parse a service from the RTB response
 * @param rtb : Slice of the RTB response containing the service details
 * @returns RTBService
 */
const parseService = (rtb: Buffer): RTBService => {
  const ID = rtb.readUInt16LE(0);
  const type = rtb.readUInt16LE(2);
  const access: RTBServiceAccess = rtb.readUInt8(4);
  const alias = rtb
    .slice(5, 22)
    .filter((v) => v !== 0x00 && v !== 0xff)
    .toString();

  return {
    ID,
    type,
    access,
    alias,
  };
};

export const hostRTB: IRTB = async (path, options) => {
  const { debug } = options;

  const port = new SerialPort(path as string, {
    ...defaultSerialOptions,
    autoOpen: false,
  });

  try {
    const isOpen = await serialPortUtils.open(port, debug);
    if (isOpen) {
      const hasWriteSucceed = await serialPortUtils.write(
        port,
        Buffer.from([0xf0, 0xff, 0x03, 0x00, 0x3d, 0x00, 0x00, 0x7e]),
        debug,
      );
      if (hasWriteSucceed) {
        return await new Promise<RTBData>((res, _rej) => {
          let remainingBytes = 0;
          let rtb = Buffer.from([]);
          let result: RTBData = {
            protocol: 0,
            target: 0,
            mode: 0,
            source: 0,
            command: 0,
            size: 0,
            nodes: [],
          };

          port.on('data', (data: Buffer) => {
            const gotHeader = data.indexOf('7e7e7e7e', 0, 'hex');
            if (gotHeader !== -1) {
              const protocol = data.readUInt8(4) & 0b1111;
              const target =
                (data.readUInt8(4) >> 4) | (data.readUInt8(5) << 4);
              const mode = data.readUInt8(6) & 0b1111;
              const source =
                (data.readUInt8(6) >> 4) | (data.readUInt8(7) << 4);
              const command = data.readUInt8(8);
              const size = data.readUInt16LE(9);
              const payload = data.slice(11);

              remainingBytes = size - payload.length;
              rtb = Buffer.concat([rtb, payload]);

              result = {
                ...result,
                protocol,
                target,
                mode,
                source,
                command,
                size,
              };
            } else if (data.length > 0 && remainingBytes > 0) {
              remainingBytes -= data.length;
              rtb = Buffer.concat([rtb, data]);

              if (remainingBytes === 0) {
                let index = 0;
                const nodes: RTBNode[] = [];
                do {
                  const mode = rtb.readUInt8(index) as RTBMode;
                  if (mode === RTBMode.NODE) {
                    nodes.push(parseNode(rtb.slice(index + 1, index + 22)));
                  } else if (mode === RTBMode.SERVICE) {
                    nodes[nodes.length - 1].services.push(
                      parseService(rtb.slice(index + 1, index + 22)),
                    );
                  }
                  index += 22;
                } while (parseMode(rtb.slice(index)) !== RTBMode.CLEAR);
                res({
                  ...result,
                  nodes,
                });
              }
            }
          });
        });
      }

      return Promise.reject(
        new Error('RTB Error: Failed to write to serial port'),
      );
    }
    return Promise.reject(new Error('RTB Error: Failed to open serial port'));
  } catch (error) {
    logger.error(
      `Error while getting the routing table from '${path}' :`,
      (error as Error).message,
    );
    return Promise.reject(error);
  } finally {
    if (port.isOpen) {
      port.close();
    }
  }
};
export default hostRTB;
