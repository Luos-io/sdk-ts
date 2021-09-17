interface CustomSerialOptions extends SerialOptions {
  dataBits: 8 | 7 | 6 | 5 | undefined;
  stopBits: 1 | 2 | undefined;
}
export const defaultSerialOptions: CustomSerialOptions = {
  baudRate: 1000000,
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
};
