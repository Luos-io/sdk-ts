import { PortInfo } from 'serialport';
import { ModuleType } from 'interfaces/common';

export interface ISerialActionHandler<T> {
  (port: SerialPort, debug: boolean): Promise<T>;
}

export interface ISerialActionWriteHandler
  extends ISerialActionHandler<boolean> {}

export interface IList<T> {
  (moduleType: ModuleType, debug: boolean): Promise<T>;
}

export const isPortInfoArray = (object: any): object is PortInfo =>
  Array.isArray(object) && object.every((o) => 'path' in o);
