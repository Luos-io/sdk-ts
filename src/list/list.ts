import { ModuleType } from 'interfaces/common';

export const List = async (moduleType: ModuleType, debug = false) =>
  typeof window !== 'undefined'
    ? await (await import('./_browser')).browserList(moduleType, debug)
    : await (await import('./_host')).hostList(moduleType, debug);
export default List;
