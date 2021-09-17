import SerialPort, { PortInfo } from 'serialport';
import { logger } from '@luos-io/utils';
import { defaultSerialOptions } from 'utils/index';
import { ModuleType, moduleTypeEnum } from 'interfaces/common';
import { isPortInfoArray } from 'list/interfaces';

export interface ICancellablePromise<T> extends Promise<T> {
  cancel: (err: Error) => void;
}

const cancellablePromiseWithTimeout = <T>(
  promise: ICancellablePromise<T>,
  time: number,
) => {
  let timer: NodeJS.Timeout;
  return Promise.race<T>([
    promise,
    new Promise<T>(
      (_res, rej) =>
        (timer = setTimeout(() => {
          const err = new Error('Timeout');
          promise.cancel(err);
          rej(err);
        }, time)),
    ),
  ]).finally(() => clearTimeout(timer));
};

const open = async (
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

const write = async (
  serialPort: SerialPort,
  debug: boolean = false,
): Promise<boolean> =>
  new Promise((res) => {
    if (debug) {
      logger.debug(`Sending detection signal to '${serialPort.path}' ...`);
    }
    serialPort.flush();
    return res(
      serialPort.write(`{"discover": {}}\r`, (err) => {
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

const read = async (port: SerialPort, debug: boolean = false) => {
  const parser: SerialPort.parsers.Readline = port.pipe(
    new SerialPort.parsers.Readline({
      delimiter: '\n',
      encoding: 'utf8',
    }),
  );
  let rejecter: (err: Error) => void;
  try {
    const promise: Partial<ICancellablePromise<ModuleType | undefined>> =
      new Promise((res, rej) => {
        rejecter = rej;

        if (debug) {
          logger.debug(`Reading data on port '${port.path}'...`);
        }

        parser.on('data', (data) => {
          try {
            const json = JSON.parse(data);
            return res(
              moduleTypeEnum.find(
                (moduleType) => json[moduleType.toLowerCase()] !== undefined,
              ) as ModuleType,
            );
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
      });

    promise.cancel = (err) => {
      if (debug) {
        logger.debug(`Read on port '${port.path}' canceled :`, err.message);
      }
      rejecter(err);
    };

    return cancellablePromiseWithTimeout(
      promise as ICancellablePromise<ModuleType | undefined>,
      5000,
    );
  } catch (err) {
    console.log('SDK/read - err', err);
    return undefined;
  }
};

const portCommunicationHandlers = {
  open,
  write,
  read,
};

const checkPortCompatibility = async (
  port: PortInfo,
  moduleType: ModuleType,
  debug: boolean = false,
) => {
  const serialPort = new SerialPort(port.path, {
    ...defaultSerialOptions,
    autoOpen: false,
  });

  try {
    const isOpen = await portCommunicationHandlers.open(serialPort, debug);
    if (isOpen) {
      const hasWriteSucceed = await portCommunicationHandlers.write(
        serialPort,
        debug,
      );
      if (hasWriteSucceed) {
        const response = await portCommunicationHandlers.read(
          serialPort,
          debug,
        );
        if (response && response.toLowerCase() === moduleType) {
          return true;
        }
      }
    }
    return false;
  } catch (_err) {
    return false;
  } finally {
    if (serialPort.isOpen) {
      serialPort.close();
    }
  }
};

export const hostList = async (moduleType: ModuleType, debug = false) => {
  const luosPorts: PortInfo[] = [];

  try {
    const portList = await SerialPort.list();
    const results = await Promise.allSettled(
      portList.map((port) => checkPortCompatibility(port, moduleType, debug)),
    );

    results.map((res, index) => {
      if (res.status === 'fulfilled') {
        if (res.value === true) {
          luosPorts.push(portList[index]);
        }
      } else if (debug) {
        logger.debug(
          `Detection signal to '${portList[index].path}' was unsuccessfull : ${res?.reason?.message}`,
        );
      }
    });
  } catch (err) {
    logger.error(
      `Error while getting the list of available '${moduleType}' :`,
      (err as Error).message,
    );
  }

  console.log('TEST', isPortInfoArray(luosPorts));
  return luosPorts;
};
export default hostList;
