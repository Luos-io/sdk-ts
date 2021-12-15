import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'lib/index.esm.js',
      format: 'es',
      inlineDynamicImports: true,
      globals: {
        '@luos-io/utils': '@luos-io/utils',
        serialport: 'SerialPort',
      },
    },
    {
      file: 'lib/index.umd.js',
      format: 'umd',
      name: 'LuosSDK',
      inlineDynamicImports: true,
      globals: {
        '@luos-io/utils': '@luos-io/utils',
        serialport: 'SerialPort',
      },
    },
  ],
  plugins: [typescript()],
  external: ['@luos-io/utils', 'serialport'],
};
