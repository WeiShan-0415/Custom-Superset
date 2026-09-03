module.exports = api => {
  const esm = api.env('esm');

  return {
    presets: [
      ['@babel/preset-env', { modules: esm ? false : 'commonjs' }],
      ['@babel/preset-react', { runtime: 'automatic' }],
      '@babel/preset-typescript',
    ],
  };
};
