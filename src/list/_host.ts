import SerialPort, { PortInfo } from 'serialport';
import { logger } from 'utils/logger';
import { defaultSerialOptions, serialPortUtils } from 'utils/index';
import { ModuleType, moduleTypeEnum } from 'interfaces/common';

const checkPortCompatibility = async (
  port: PortInfo,
  moduleType: ModuleType,
  debug: boolean = false,
) => {
  const serialPort = new SerialPort(port.path, {
    ...defaultSerialOptions,
    autoOpen: false,
  });

  try {
    const isOpen = await serialPortUtils.open(serialPort, debug);
    if (isOpen) {
      const hasWriteSucceed = await serialPortUtils.write(
        serialPort,
        '{"discover": {}}\r',
        debug,
      );
      if (hasWriteSucceed) {
        const json = await serialPortUtils.read(serialPort, debug);
        const response = moduleTypeEnum.find(
          (moduleType) => json[moduleType.toLowerCase()] !== undefined,
        ) as ModuleType;

        if (response && response.toLowerCase() === moduleType) {
          return true;
        }
      }
    }
    return false;
  } catch (_err) {
    return false;
  } finally {
    if (serialPort.isOpen) {
      serialPort.close();
    }
  }
};

export const hostList = async (moduleType: ModuleType, debug = false) => {
  const luosPorts: PortInfo[] = [];

  try {
    const portList = await SerialPort.list();
    const results = await Promise.allSettled(
      portList.map((port) => checkPortCompatibility(port, moduleType, debug)),
    );

    results.map((res, index) => {
      if (res.status === 'fulfilled') {
        if (res.value === true) {
          luosPorts.push(portList[index]);
        }
      } else if (debug) {
        logger.debug(
          `Detection signal to '${portList[index].path}' was unsuccessfull : ${res?.reason?.message}`,
        );
      }
    });
  } catch (err) {
    logger.error(
      `Error while getting the list of available '${moduleType}' :`,
      (err as Error).message,
    );
  }

  return luosPorts;
};
export default hostList;
