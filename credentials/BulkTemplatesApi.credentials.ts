import {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class BulkTemplatesApi implements ICredentialType {
  name = 'bulkTemplatesApi';
  displayName = 'BulkTemplates API';
  documentationUrl = 'https://bulktemplates.com/docs';

  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description:
        'Your BulkTemplates API key (starts with bk_). Get one at bulktemplates.com → Editor → Settings → API Keys',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        'x-api-key': '={{$credentials.apiKey}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://bulktemplates.com',
      url: '/api/templates?summary=1',
      method: 'GET',
    },
  };
}
