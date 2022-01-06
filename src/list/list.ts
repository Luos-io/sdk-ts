import { ModuleType } from 'interfaces/common';

export const List = async (moduleType: ModuleType, debug = false) =>
  await (await import('./_host')).hostList(moduleType, debug);
export default List;
