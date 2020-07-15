import {
  Message,
  log,
}           from 'wechaty'

function mentionMatcher (mention: boolean) {
  log.verbose('WechatyQnAMaker', 'mentionMatcher(%s)', mention)

  return async function matchMention (message: Message): Promise<boolean> {
    const room = message.room()

    if (!room)                            { return false }

    if (mention) {
      if (!await message.mentionSelf())   { return false }
    }

    return true
  }
}

export { mentionMatcher }
