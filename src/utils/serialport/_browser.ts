import { logger } from 'utils/logger';
import { defaultSerialOptions } from 'utils/index';

export const open = async (
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

export const close = async (
  port: SerialPort,
  _debug: boolean = false,
): Promise<boolean> => {
  try {
    await port.close();
    return true;
  } catch (err) {
    // TO DO - Read spec to handle correctly errors on close.
    // if (
    //   (err as DOMException).code === DOMException.INVALID_STATE_ERR &&
    //   debug
    // ) {
    //   const { usbProductId, usbVendorId } = port.getInfo();
    //   logger.debug(`Port (${usbProductId} / ${usbVendorId}) already open`);
    // }
    return false;
  }
};

export const write = async (
  port: SerialPort,
  data: string | Buffer,
  debug: boolean = false,
): Promise<boolean> => {
  if (port.writable) {
    const { usbProductId, usbVendorId } = port.getInfo();
    const encoder = new TextEncoderStream();
    const writer = encoder.writable.getWriter();

    encoder.readable.pipeTo(port.writable);

    try {
      await writer.ready;
      await writer.write(data.toString());

      if (debug) {
        logger.debug(
          `Sending message ${data} to '${usbProductId} - ${usbVendorId}' ...`,
        );
      }

      await writer.ready;
      await writer.close();

      return true;
    } catch (err) {
      logger.error(
        `Error while writing on serial port : '${usbProductId} - ${usbVendorId}'`,
        (err as Error).message,
      );
      return false;
    }
  }

  return false;
};

export const read = async (
  port: SerialPort,
  debug: boolean = false,
): Promise<any | undefined> => {
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
        reader.releaseLock();
        return message;
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
