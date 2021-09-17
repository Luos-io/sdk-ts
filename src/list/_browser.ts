import { logger } from '@luos-io/utils';
import { defaultSerialOptions } from 'utils/index';
import { ModuleType, moduleTypeEnum } from 'interfaces/common';
import type { IList } from './interfaces';

const open = async (
  port: SerialPort,
  debug: boolean = false,
): Promise<boolean> => {
  try {
    await port.open(defaultSerialOptions);
    return true;
  } catch (err) {
    if (
      (err as DOMException).code === DOMException.INVALID_STATE_ERR &&
      debug
    ) {
      const { usbProductId, usbVendorId } = port.getInfo();
      logger.debug(`Port (${usbProductId} / ${usbVendorId}) already open`);
    }
    return false;
  }
};

const write = async (
  port: SerialPort,
  debug: boolean = false,
): Promise<boolean> => {
  if (port.writable) {
    const encoder = new TextEncoderStream();
    const writer = encoder.writable.getWriter();

    encoder.readable.pipeTo(port.writable);

    try {
      await writer.ready;
      await writer.write('{"discover": {}}\r');

      if (debug) {
        logger.debug('Chunk written to sink.');
      }

      await writer.ready;
      await writer.close();

      return true;
    } catch (err) {
      logger.error(
        'Error while writing on serial port',
        (err as Error).message,
      );
      return false;
    }
  }

  return false;
};

const read = async (
  port: SerialPort,
  debug: boolean = false,
): Promise<ModuleType | undefined> => {
  if (port.readable) {
    const decoder = new TextDecoderStream();
    const reader = decoder.readable.getReader();
    port.readable.pipeTo(decoder.writable);

    try {
      let message = '';
      while (port.readable) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        message += value;
        if (debug && value) {
          logger.debug('Chunk decoded', value);
        }
        if (message) {
          reader.releaseLock();
          const json = JSON.parse(message);
          return moduleTypeEnum.find(
            (moduleType) => json[moduleType.toLowerCase()] !== undefined,
          ) as ModuleType;
        }
      }
      if (debug) {
        logger.log('Message received', message);
      }
    } catch (err) {
      const { message, stack } = err as Error;
      logger.error(
        'Error while reading data from :',
        message,
        stack ? stack : '',
      );
    } finally {
      reader.releaseLock();
    }
  }
  return undefined;
};

const portCommunicationHandlers = {
  open,
  write,
  read,
};

const checkPortCompatibility = async (
  port: SerialPort,
  moduleType: ModuleType,
  debug: boolean = false,
): Promise<boolean> => {
  try {
    const isPortOpen = await portCommunicationHandlers.open(port, debug);
    if (isPortOpen) {
      const hasWriteSucceed = await portCommunicationHandlers.write(
        port,
        debug,
      );
      if (hasWriteSucceed) {
        const response = await portCommunicationHandlers.read(port, debug);
        if (response && response === moduleType) {
          return true;
        }
      }
    }
  } catch (err) {
    logger.warn(
      'Can not init communication with the serial port.',
      (err as Error).message,
    );
  }

  return false;
};

export const browserList: IList<SerialPort[]> = async (moduleType, debug) => {
  const luosPorts: SerialPort[] = [];
  const allowedPorts = await navigator.serial.getPorts();
  if (allowedPorts.length > 0) {
    await Promise.all(
      allowedPorts.map(async (port) => {
        const isLuosCompatible = await checkPortCompatibility(
          port,
          moduleType,
          debug,
        );
        if (isLuosCompatible) {
          luosPorts.push(port);
        }
      }),
    );
  } else {
    try {
      const port = await navigator.serial.requestPort();
      const isLuosCompatible = await checkPortCompatibility(
        port,
        moduleType,
        debug,
      );
      if (isLuosCompatible) {
        luosPorts.push(port);
      }
    } catch (err) {
      logger.warn('Can not get the user serial port.', (err as Error).message);
    }
  }

  return luosPorts;
};
export default browserList;
