#!/usr/bin/env -S node --no-warnings --loader ts-node/esm

import { test }  from 'tstest'

import { asker } from './asker.js'
import { normalizeConfig } from './normalize-config.js'

test('asker()', async t => {
  // use our normalizeConfig() helper function to get the config:
  //
  // const resourceName    = process.env.WECHATY_PLUGIN_QNAMAKER_RESOURCE_NAME
  // const endpointKey     = process.env.WECHATY_PLUGIN_QNAMAKER_ENDPOINT_KEY
  // const knowledgeBaseId = process.env.WECHATY_PLUGIN_QNAMAKER_KNOWLEDGE_BASE_ID

  const config = normalizeConfig({})
  const ask = asker(config)

  let answers = await ask('wechaty')
  t.ok(answers[0]!.answer, 'should get answer back: ' + answers[0]!.answer)

  answers = await ask('中文')
  t.equal(answers.length, 0, 'should get no answer for 中文')
})
