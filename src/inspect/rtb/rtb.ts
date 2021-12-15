import { RTBOptions } from './interfaces';

export const RTB = async (path: string | SerialPort, options: RTBOptions) =>
  typeof window !== 'undefined'
    ? await (await import('./_browser')).browserRTB(path as SerialPort, options)
    : await (await import('./_host')).hostRTB(path as string, options);
export default RTB;
