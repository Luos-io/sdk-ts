import { PortInfo } from 'serialport';
import { ModuleType } from 'interfaces/common';

export const isPortInfoArray = (object: any): object is PortInfo =>
  Array.isArray(object) && object.every((o) => 'path' in o);
export interface IList<T> {
  (moduleType: ModuleType, debug: boolean): Promise<T>;
}
export default IList;
