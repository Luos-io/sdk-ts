export interface InspectData {
  timestamp: number;
  protocol: number;
  target: number;
  target_mode: number;
  source: number;
  cmd: number;
  size: number;
  msg: string;
}

export interface InspectCallback {
  (): Promise<boolean>;
}

export type InspectOptions = {
  debug: boolean;
  time: number;
  onData: (data: InspectData) => void;
};

export interface IInspect {
  (path: string, options: InspectOptions): Promise<InspectCallback>;
}
export default IInspect;
