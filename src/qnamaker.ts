import { matchers } from 'wechaty-plugin-contrib'

export interface QnAMakerOptions {
  endpointKey     : string
  knowledgeBaseId : string
  resourceName    : string
  scoreThreshold  : number,
  language?       : matchers.LanguageMatcherOptions,
}

const DEFAULT_SCORE_THRESHOLD = 70

export {
  DEFAULT_SCORE_THRESHOLD,
}
