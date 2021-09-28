export * as serialPortUtils from 'utils/serialport';

interface CustomSerialOptions extends SerialOptions {
  dataBits: 8 | 7 | 6 | 5 | undefined;
  stopBits: 1 | 2 | undefined;
}
export const defaultSerialOptions: CustomSerialOptions = {
  baudRate: 1000000,
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
};

export interface ICancellablePromise<T> extends Promise<T> {
  cancel: (err: Error) => void;
}

export const cancellablePromiseWithTimeout = <T>(
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
