import { InspectOptions } from 'inspect/interfaces';

export const browserInspect = async (
  port: SerialPort,
  options: InspectOptions,
) => {
  // TMP
  port;
  options;
  // END TMP

  return () => Promise.reject(new Error('NOT_IMPL'));
};
export default browserInspect;
