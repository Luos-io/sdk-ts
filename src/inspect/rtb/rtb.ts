import { RTBOptions } from './interfaces';

export const RTB = async (path: string | SerialPort, options: RTBOptions) =>
  await (await import('./_host')).hostRTB(path as string, options);
export default RTB;
