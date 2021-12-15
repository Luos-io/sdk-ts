import { IRTB } from './interfaces';

export const browserRTB: IRTB = (path, options) => {
  console.log('browserRTB', { path, options });

  return new Promise((resolve) =>
    resolve({
      protocol: 0,
      target: 0,
      mode: 0,
      source: 0,
      command: 0,
      size: 0,
      nodes: [],
    }),
  );
};
export default browserRTB;
