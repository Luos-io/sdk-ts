export interface RTBOptions {
  debug: boolean;
}
export enum RTBMode {
  CLEAR,
  SERVICE,
  NODE,
}
export enum RTBServiceAccess {
  READ_WRITE_ACCESS,
  READ_ONLY_ACCESS,
  WRITE_ONLY_ACCESS,
  NO_ACCESS,
}
export type RTBServiceAlias = string[];
export interface RTBService {
  ID: number;
  type: number;
  access: RTBServiceAccess;
  alias: string;
}
export interface RTBNode {
  ID: number;
  certificate: boolean;
  portTable: number[];
  services: RTBService[];
}
export interface RTBData {
  protocol: number;
  target: number;
  mode: number;
  source: number;
  command: number;
  size: number;
  nodes: RTBNode[];
}

export interface IRTB {
  (path: string, options: RTBOptions): Promise<RTBData>;
}
export default IRTB;
