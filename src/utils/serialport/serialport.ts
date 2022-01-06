export const open = async (port: any, debug: boolean) =>
  await (await import('./_host')).open(port, debug);

export const close = async (port: any, debug: boolean) =>
  await (await import('./_host')).close(port, debug);

export const read = async (port: any, debug: boolean) =>
  await (await import('./_host')).read(port, debug);

export const write = async (port: any, data: string | Buffer, debug: boolean) =>
  await (await import('./_host')).write(port, data, debug);
