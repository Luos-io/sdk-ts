import { InspectOptions } from './interfaces';

export const Inspect = async (
  path: string | SerialPort,
  options: InspectOptions,
) =>
  typeof window !== 'undefined'
    ? await (
        await import('./_browser')
      ).browserInspect(path as SerialPort, options)
    : await (await import('./_host')).hostInspect(path as string, options);
export default Inspect;
