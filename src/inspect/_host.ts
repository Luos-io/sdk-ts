import { logger } from '@luos-io/utils';
import SerialPort from 'serialport';
import { defaultSerialOptions, serialPortUtils } from 'utils/index';

import type { IInspect } from './interfaces';

export const hostInspect: IInspect = async (path, options) => {
  const { debug } = options;

  const port = new SerialPort(path, {
    ...defaultSerialOptions,
    autoOpen: false,
  });

  const closeCallback = () => serialPortUtils.close(port, debug);

  try {
    const isOpen = await serialPortUtils.open(port, debug);
    if (isOpen) {
      const hasWriteInitSucceed = await serialPortUtils.write(
        port,
        'init',
        debug,
      );
      if (hasWriteInitSucceed) {
        const initRes = await new Promise((res, _rej) => {
          const decoder = new TextDecoder();
          port.on('data', (data) => {
            res(decoder.decode(data));
          });
        });

        if (initRes === 'yes') {
          port.removeAllListeners();
          const hasWriteStartSucceed = await serialPortUtils.write(
            port,
            'start',
            debug,
          );
          if (hasWriteStartSucceed) {
            console.log('started');
            const parser: SerialPort.parsers.Readline = port.pipe(
              new SerialPort.parsers.Readline({
                delimiter: [0x7e, 0x7e, 0x7e],
                encoding: 'hex',
              }),
            );

            await new Promise((res, _rej) => {
              parser.on('data', (data) => {
                const timestamp = Buffer.from(data.slice(0, 16), 'hex')
                  .reverse()
                  .reduce((acc, b) => (acc = (acc << 8) + b), 0);
                const protocol = data.slice(17, 18);
                const target = data.slice(18, 20) + data.slice(16, 17);
                const target_mode = data.slice(21, 22);
                const source = data.slice(22, 24) + data.slice(20, 21);
                const cmd = data.slice(24, 26);
                const size = data.slice(28, 30) + data.slice(26, 28);
                const size_num = parseInt(size, 16);

                let msg: string | number;
                if (size_num > 128) {
                  msg = data.slice(30, 30 + 128 * 2);
                } else if (size_num === 0) {
                  msg = 0;
                } else {
                  msg = data.slice(30, 30 + size_num * 2);
                }

                res({
                  timestamp,
                  protocol,
                  target,
                  target_mode,
                  source,
                  cmd,
                  size,
                  msg,
                });
              });
            });
          }
        }
      }

      return closeCallback;
    }

    return () => Promise.reject<boolean>(new Error('NOT_OPEN'));
  } catch (err) {
    logger.error(`Error while inspecting : ${path}`, (err as Error).message);
    return () => Promise.reject<boolean>(err);
  }
};
export default hostInspect;
