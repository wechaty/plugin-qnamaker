import {
  Wechaty,
  WechatyPlugin,
  log,
  Message,
  types,
}                   from 'wechaty'
import {
  matchers,
}                   from 'wechaty-plugin-contrib'

import { asker }            from './asker.js'
import { normalizeConfig }  from './normalize-config.js'
import { mentionMatcher }        from './mention-matcher.js'

import type { QnAMakerOptions } from './qnamaker.js'

interface WechatyQnAMakerConfigMatcher {
  contact?        : matchers.ContactMatcherOptions,
  room?           : matchers.RoomMatcherOptions,
  mention?        : boolean,
  skipMessage?    : matchers.MessageMatcherOptions,
}

export type WechatyQnAMakerConfig = WechatyQnAMakerConfigMatcher & Partial<QnAMakerOptions>

function WechatyQnAMaker (config: WechatyQnAMakerConfig): WechatyPlugin {
  log.verbose('WechatyQnAMaker', 'WechatyQnAMaker(%s)', JSON.stringify(config))

  const normalizedConfig = normalizeConfig(config)

  const ask = asker(normalizedConfig)

  const matchContact = typeof config.contact === 'undefined'
    ? () => true
    : matchers.contactMatcher(config.contact)

  const matchRoom = typeof config.room === 'undefined'
    ? () => true
    : matchers.roomMatcher(config.room)

  const matchSkipMessage = typeof config.skipMessage === 'undefined'
    ? () => false // default not skip any messages
    : matchers.messageMatcher(config.skipMessage)

  const matchMention = (typeof config.mention === 'undefined')
    ? mentionMatcher(true) // default: true
    : mentionMatcher(config.mention)

  const matchLanguage = (typeof config.language === 'undefined')
    ? () => true  // match all language by default
    : matchers.languageMatcher(config.language)

  const isPluginMessage = async (message: Message): Promise<boolean> => {
    if (message.self())                       { return false }
    if (message.type() !== types.Message.Text) { return false }

    const mentionList = await message.mentionList()
    if (mentionList.length > 0) {
      if (!await message.mentionSelf()) { return false }
    }

    return true
  }

  const isConfigMessage = async (message: Message): Promise<boolean> => {
    const from = message.from()
    const room = message.room()

    if (await matchSkipMessage(message))                  { return false }

    if (room) {
      if (!await matchRoom(room))                         { return false }
      if (!await matchMention(message))                        { return false }

      /**
       * Mention others but not include the bot
       */
      const mentionList = await message.mentionList()
      const mentionSelf = await message.mentionSelf()
      if (mentionList.length > 0 && !mentionSelf)         { return false }
    } else {
      if (from && !await matchContact(from))              { return false }
    }

    const text = await message.mentionText()
    if (!matchLanguage(text))                             { return false }

    return true
  }

  /**
   * Connect with Wechaty
   */
  return function WechatyQnAMakerPlugin (wechaty: Wechaty) {
    log.verbose('WechatyQnAMaker', 'WechatyQnAMakerPlugin(%s)', wechaty)

    const onMessage = async (message: Message) => {
      log.verbose('WechatyQnAMaker', 'WechatyQnAMakerPlugin() wechaty.on(message) %s', message)

      if (!await isPluginMessage(message)) {
        log.silly('WechatyQnAMaker', 'WechatyQnAMakerPlugin() wechaty.on(message) message not match this plugin, skipped.')
        return
      }

      if (!await isConfigMessage(message)) {
        log.silly('WechatyQnAMaker', 'WechatyQnAMakerPlugin() wechaty.on(message) message not match config, skipped.')
        return
      }

      const text = await message.mentionText()
      if (!text) { return }

      const answers = await ask(text)
      if (answers.length <= 0 || !answers[0]) { return }

      const answer = answers[0].answer
      if (!answer) {
        throw new Error('no answer?')
      }

      const from = message.from()
      const room = message.room()

      if (from && room && await message.mentionSelf()) {
        await room.say(answer, from)
      } else {
        await message.say(answer)
      }

    }

    wechaty.on('message', onMessage)

    const uninstaller = () => { wechaty.off('message', onMessage) }
    return uninstaller
  }
}

export { WechatyQnAMaker }
