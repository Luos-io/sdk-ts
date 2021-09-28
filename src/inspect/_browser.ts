import type { IInspect } from './interfaces';

export const browserInspect: IInspect = async (path, options) => {
  // TMP
  path;
  options;
  // END TMP

  return () => Promise.reject(new Error('NOT_IMPL'));
};
export default browserInspect;
