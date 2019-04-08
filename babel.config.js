/* eslint-disable */
module.exports = api => {
  api.cache(true)
  return {
    presets: [
      [
        '@babel/env',
        {
          useBuiltIns: 'entry'
        }
      ]
    ],
    plugins: [
      [
        '@babel/plugin-transform-runtime'
      ]
    ]
  }
}
