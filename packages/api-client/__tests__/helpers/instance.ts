import type { HTTPClient } from '~/core'
import type { IController } from '~/interfaces/controller'

import { axiosAdaptor } from '~/adaptors/axios'
import { createClient } from '~/core'

export const mockRequestInstance = (
  injectController: new (client: HTTPClient) => IController,
) => {
  const client = createClient(axiosAdaptor)('https://api.innei.ren/v2')
  client.injectControllers(injectController)
  return client
}
