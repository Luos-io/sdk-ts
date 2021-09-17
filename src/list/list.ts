import { ModuleType } from 'interfaces/common';

export const List = async (moduleType: ModuleType, debug = false) => {
  if (typeof window !== 'undefined') {
    return await (await import('./_browser')).browserList(moduleType, debug);
  } else {
    return await (await import('./_host')).hostList(moduleType, debug);
  }
};
export default List;
