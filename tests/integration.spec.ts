#!/usr/bin/env -S node --no-warnings --loader ts-node/esm

import {
  test,
}             from 'tstest'

import * as plugins             from '../src/mod.js'

// import {
//   Wechaty,
// }                               from 'wechaty'
// import {
//   validatePlugin,
// }                               from 'wechaty-plugin-contrib'

// import {
//   PuppetMock,
// }                 from 'wechaty-puppet-mock'

test('integration testing', async (t) => {
  // const bot = Wechaty.instance({
  //   puppet: new PuppetMock(),
  // }).use(plugins.WechatyIntercom({
  //   intercomToken: 'fas',
  //   room: 'id',
  //   webhookProxyUrl: 'https://smee.io/fdasfadsfasdfs',
  // }))
  await t.skip('should get a bot')
})

test('plugin name', async t => {
  for (const plugin of Object.values(plugins)) {
    if (typeof plugin !== 'function') {
      continue
    }

    if (plugin.name === 'validatePlugin') {
      continue  // our helper functions
    }

    await t.skip('to be fixed')
    // t.doesNotThrow(() => validatePlugin(plugin), 'plugin ' + plugin.name + ' should be valid')
  }
})
