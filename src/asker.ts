/**
 * QuickStart: QnA Maker client library
 *  https://docs.microsoft.com/en-us/azure/cognitive-services/qnamaker/quickstarts/quickstart-sdk?tabs=visual-studio&pivots=programming-language-javascript#qnamakerruntimeclient-object-model
 *
 * Azure-Samples/cognitive-services-quickstart-code
 *  https://github.com/Azure-Samples/cognitive-services-quickstart-code/blob/master/javascript/QnAMaker/sdk/qnamaker_quickstart.js
 */
import * as msRest  from '@azure/ms-rest-js'
import * as runtime from '@azure/cognitiveservices-qnamaker-runtime'

import { log } from 'wechaty'

import { QnAMakerOptions } from './qnamaker'
import { QueryDTO } from '@azure/cognitiveservices-qnamaker-runtime/esm/models'

function asker (options: QnAMakerOptions) {
  log.verbose('WechatyQnAMaker', 'asker(%s)', JSON.stringify(options))

  const customHeaders = { Authorization: `EndpointKey ${options.endpointKey}` }

  const queryingURL = `https://${options.resourceName}.azurewebsites.net`
  const queryRuntimeCredentials = new msRest.ApiKeyCredentials({
    inHeader: { 'Ocp-Apim-Subscription-Key': options.endpointKey },
  })
  const runtimeClient = new runtime.QnAMakerRuntimeClient(queryRuntimeCredentials, queryingURL)

  return async function ask (
    question : string,
    dto      : QueryDTO = {},
  ): Promise<runtime.QnAMakerRuntimeModels.QnASearchResult[]> {
    log.verbose('WechatyQnAMaker', 'ask(%s, %s)', question, JSON.stringify(dto))

    const normalizedQueryDto: QueryDTO = {
      scoreThreshold : options.scoreThreshold,
      ...dto,
      question,
    }

    log.verbose('WechatyQnAMaker', 'ask() normalizedQueryDto: %s', JSON.stringify(normalizedQueryDto))

    const requestQuery = await runtimeClient.runtime.generateAnswer(
      options.knowledgeBaseId,
      normalizedQueryDto,
      { customHeaders }
    )
    // console.info(JSON.stringify(requestQuery))

    const answers = requestQuery.answers || []
    return answers.filter(item => item.score)
  }

}

export {
  asker,
}
