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

interface QnAMakerOptions {
  endpointKey     : string,
  knowledgeBaseId : string,
  resourceName    : string,
  minScore        : number,
}

function asker (options: QnAMakerOptions) {
  log.verbose('WechatyQnAMaker', 'asker(%s)', JSON.stringify(options))

  const customHeaders = { Authorization: `EndpointKey ${options.endpointKey}` }

  const queryingURL = `https://${options.resourceName}.azurewebsites.net`
  const queryRuntimeCredentials = new msRest.ApiKeyCredentials({
    inHeader: { 'Ocp-Apim-Subscription-Key': options.endpointKey },
  })
  const runtimeClient = new runtime.QnAMakerRuntimeClient(queryRuntimeCredentials, queryingURL)

  return async function ask (question: string): Promise<void | string> {
    log.verbose('WechatyQnAMaker', 'ask(%s)', question)

    const requestQuery = await runtimeClient.runtime.generateAnswer(
      options.knowledgeBaseId,
      {
        question,
        // strictFilters: [
        //   {
        //     name: 'Category',
        //     value: 'api',
        //   },
        // ],
        top: 1,
      },
      { customHeaders }
    )
    // console.info(JSON.stringify(requestQuery))

    const answers = requestQuery.answers

    if (answers && answers.length > 0) {

      const answer = answers[0].answer
      const score  = answers[0].score

      if (score && score > options.minScore) {
        log.verbose('WechatyQnAMaker', 'ask(%s) PASS score/min = %s/%s > 1 for answer %s',
          question,
          score,
          options.minScore,
          answer,
        )
        return answer
      }

      log.verbose('WechatyQnAMaker', 'ask(%s) SKIP score/min = %s/%s < 1 for answer %s',
        question,
        score,
        options.minScore,
        answer,
      )

    }

  }

}

export {
  asker,
}
