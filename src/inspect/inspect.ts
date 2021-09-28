import { IInspect } from 'inspect';

export const Inspect: IInspect = async (path, options) =>
  typeof window !== 'undefined'
    ? await (await import('./_browser')).browserInspect(path, options)
    : await (await import('./_host')).hostInspect(path, options);
export default Inspect;
