export interface InspectCallback {
  (): Promise<boolean>;
}

export type InspectOptions = {
  debug: boolean;
  time: number;
};

export interface IInspect {
  (path: string, options: InspectOptions): Promise<InspectCallback>;
}
export default IInspect;
