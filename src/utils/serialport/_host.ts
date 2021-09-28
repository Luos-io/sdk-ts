import SerialPort from 'serialport';
import { logger } from '@luos-io/utils';

import { cancellablePromiseWithTimeout, ICancellablePromise } from '../index';

export const open = async (
  port: SerialPort,
  debug: boolean = false,
): Promise<boolean> => {
  if (debug) {
    logger.debug(`Opening port : '${port.path}' ...`);
  }

  return new Promise((resolve) => {
    port.open((err) => {
      if (err && debug) {
        logger.debug(
          `Can't open the serial port : '${port.path}'`,
          err.message,
        );
        return resolve(false);
      }

      return resolve(true);
    });
  });
};

export const close = async (
  port: SerialPort,
  debug: boolean = false,
): Promise<boolean> => {
  if (debug) {
    logger.debug(`Closing port : '${port.path}'' ...`);
  }

  return new Promise((resolve) => {
    port.close((err) => {
      if (err && debug) {
        logger.debug(
          `Can't close the serial port : '${port.path}'}'`,
          err.message,
        );
        return resolve(false);
      }
      return resolve(true);
    });
  });
};

export const write = async (
  serialPort: SerialPort,
  data: string,
  debug: boolean = false,
): Promise<boolean> =>
  new Promise((res) => {
    if (debug) {
      logger.debug(`Sending message to '${serialPort.path}' ...`);
    }
    serialPort.flush();
    return res(
      serialPort.write(data, (err) => {
        if (err) {
          logger.error(
            `Can't write on serial port : '${serialPort.path}'`,
            err.message,
          );
          serialPort.close();
        }
      }),
    );
  });

export const read = async (port: SerialPort, debug: boolean = false) => {
  const parser: SerialPort.parsers.Readline = port.pipe(
    new SerialPort.parsers.Readline({
      delimiter: '\n',
      encoding: 'utf8',
    }),
  );
  let rejecter: (err: Error) => void;
  try {
    const promise: Partial<ICancellablePromise<any | undefined>> = new Promise(
      (res, rej) => {
        rejecter = rej;

        if (debug) {
          logger.debug(`Reading data on port '${port.path}'...`);
        }

        parser.on('data', (data) => {
          try {
            const json = JSON.parse(data);
            return res(json);
          } catch (err) {
            // Unparsable JSON received
            if (debug) {
              logger.debug(
                'Unparsable JSON data received',
                (err as Error).message,
              );
            }
            return rej(undefined);
          }
        });
      },
    );

    promise.cancel = (err) => {
      if (debug) {
        logger.debug(`Read on port '${port.path}' canceled :`, err.message);
      }
      rejecter(err);
    };

    return cancellablePromiseWithTimeout(
      promise as ICancellablePromise<any | undefined>,
      5000,
    );
  } catch (err) {
    return undefined;
  }
};
