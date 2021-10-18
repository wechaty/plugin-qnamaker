import { log }        from 'wechaty'
import type {
  Args,
  CommandContext,
  Vorpal,
}                    from 'wechaty-vorpal'
import {
  matchers,
}                    from 'wechaty-plugin-contrib'

import type { QnAMakerOptions } from './qnamaker.js'
import { normalizeConfig } from './normalize-config.js'
import { asker }           from './asker.js'
import type {
  QnASearchResult,
  QueryDTO,
  // eslint-disable-next-line
}                         from '@azure/cognitiveservices-qnamaker-runtime/esm/models'

function Faq (config: Partial<QnAMakerOptions> | Partial<QnAMakerOptions>[]) {
  log.verbose('WechatyQnAMaker', 'Faq(%s)', JSON.stringify(config))

  const normalizedConfigList: QnAMakerOptions[] = []

  if (!Array.isArray(config)) {
    normalizedConfigList.push(normalizeConfig(config))
  } else {
    normalizedConfigList.push(
      ...config.map(c => normalizeConfig(c)),
    )
  }

  return function FaqExtension (vorpal: Vorpal) {
    log.verbose('WechatyQnAMaker', 'FaqExtension(vorpal)')

    vorpal
      .command('faq <question...>', 'Get an answer from Frequent Asked Questions (FAQ)')
      .option('-v --verbose', 'Show verbose informations')
      .option('-n --number <number>', 'Show maximum <number> related answers. (default: 1)')
      .action(faqAction(normalizedConfigList))
  }
}

interface FaqOptions {
  verbose? : boolean,
  number?  : number,
}

const faqAction = (configList : QnAMakerOptions[]) => {
  log.verbose('WechatyQnAMaker', 'Faq() faqAction("%s")', JSON.stringify(configList))

  const askerDictList = configList.map(config => ({
    ask           : asker(config),
    matchLanguage : (typeof config.language === 'undefined')
      ? () => true  // match all language by default
      : matchers.languageMatcher(config.language),
  }))

  const askAll = async (
    question : string,
    dto      : QueryDTO = {},
  ) => {
    const resultList = await Promise.all(
      askerDictList
        .filter(dict => dict.matchLanguage(question))
        .map(dict => dict.ask(question, dto)),
    )

    return resultList
      .flat()
      .filter(i => i.score)
      .sort((a, b) => b.score! - a.score!)
  }

  return async function faqActionExector (
    this: CommandContext,
    args: Args,
  ): Promise<void> {
    log.verbose('WechatyQnAMaker', 'Faq() faqAction() faqActionExecutor("%s")', JSON.stringify(args))

    const options: FaqOptions = args.options

    let question: string
    if (Array.isArray(args['question'])) {
      question = args['question'].join(' ')
    } else {
      question = args['question']!
    }

    const queryDto: QueryDTO = {
      scoreThreshold : 1,
      top            : options.number,
    }

    const searchResultList = await askAll(question, queryDto)

    if (searchResultList.length <= 0) {
      this.log('Sorry, I did not find any answer in my KB (Knowledge Base) for your question: "' + question + '".')
      return
    }

    log.verbose('WechatyQnAMaker', 'Faq() faqAction() faqActionExecutor() found %s answers', searchResultList.length)

    searchResultList.forEach((result, idx) => {
      if (!result.answer)               { return }
      if (idx > (options.number ?? 0))  { return }

      this.log(
        toReply(result, idx + 1, options.verbose),
      )
    })
  }

}

function toReply (
  result : QnASearchResult,
  index  : number,
  verbose = false,
): string {
  if (!verbose) {
    return result.answer!
  }

  const list = [
    `A${index}:(score:${Math.floor(result.score || 0)}) ${result.answer}`,
  ]

  if (result.questions) {
    list.unshift('')
    list.unshift(`Q${index}: ` + result.questions[0])
  }

  return list.join('\n')
}

export { Faq }
