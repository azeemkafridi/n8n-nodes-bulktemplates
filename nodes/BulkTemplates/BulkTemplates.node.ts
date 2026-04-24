import {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';

const BASE_URL = 'https://bulktemplates.com';

export class BulkTemplates implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'BulkTemplates',
    name: 'bulkTemplates',
    icon: 'file:icon.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
    description: 'Render branded images from BulkTemplates templates',
    defaults: { name: 'BulkTemplates' },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'bulkTemplatesApi',
        required: true,
      },
    ],
    properties: [
      // ── Resource ──
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          { name: 'Template', value: 'template' },
          { name: 'Render', value: 'render' },
          { name: 'Batch', value: 'batch' },
        ],
        default: 'render',
      },

      // ── Template operations ──
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['template'] } },
        options: [
          {
            name: 'List',
            value: 'list',
            description: 'List all templates (lightweight summary)',
            action: 'List templates',
          },
          {
            name: 'Get',
            value: 'get',
            description: 'Get full definition for a single template',
            action: 'Get a template',
          },
        ],
        default: 'list',
      },

      // ── Render operations ──
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['render'] } },
        options: [
          {
            name: 'Render by Template ID',
            value: 'renderById',
            description: 'Render a PNG using a saved template ID',
            action: 'Render by template ID',
          },
          {
            name: 'Render Inline',
            value: 'renderInline',
            description: 'Render a PNG from an inline template definition (JSON)',
            action: 'Render inline',
          },
        ],
        default: 'renderById',
      },

      // ── Batch operations ──
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['batch'] } },
        options: [
          {
            name: 'Submit',
            value: 'submit',
            description: 'Submit a batch render job from a CSV',
            action: 'Submit a batch job',
          },
          {
            name: 'Status',
            value: 'status',
            description: 'Get the status and file list of a batch job',
            action: 'Get batch job status',
          },
          {
            name: 'Download File',
            value: 'downloadFile',
            description: 'Download a single rendered PNG from a completed batch job',
            action: 'Download a batch file',
          },
        ],
        default: 'submit',
      },

      // ── Template: get ──
      {
        displayName: 'Template ID',
        name: 'templateId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['template'], operation: ['get'] } },
        description: 'The template ID (e.g. yellow-square)',
      },

      // ── Render: renderById ──
      {
        displayName: 'Template ID',
        name: 'templateId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['render'], operation: ['renderById'] } },
        description: 'The template ID to render (e.g. yellow-square)',
      },
      {
        displayName: 'Field Data (JSON)',
        name: 'fieldData',
        type: 'string',
        typeOptions: { rows: 4 },
        default: '{}',
        displayOptions: { show: { resource: ['render'], operation: ['renderById'] } },
        description:
          'JSON object mapping template field keys to values. Example: {"heading":"Hello","imageUrl":"https://..."}',
      },

      // ── Render: renderInline ──
      {
        displayName: 'Template (JSON)',
        name: 'templateJson',
        type: 'string',
        typeOptions: { rows: 6 },
        default: '{}',
        required: true,
        displayOptions: { show: { resource: ['render'], operation: ['renderInline'] } },
        description: 'Full template definition as a JSON object (TemplateDef schema)',
      },
      {
        displayName: 'Field Data (JSON)',
        name: 'fieldData',
        type: 'string',
        typeOptions: { rows: 4 },
        default: '{}',
        displayOptions: { show: { resource: ['render'], operation: ['renderInline'] } },
        description: 'JSON object mapping template field keys to values',
      },

      // ── Render: output binary property (shared) ──
      {
        displayName: 'Output Binary Property',
        name: 'binaryProperty',
        type: 'string',
        default: 'data',
        required: true,
        displayOptions: { show: { resource: ['render'], operation: ['renderById', 'renderInline'] } },
        description: 'Name of the binary property to store the rendered PNG in',
      },

      // ── Batch: submit ──
      {
        displayName: 'Template ID',
        name: 'templateId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['batch'], operation: ['submit'] } },
        description: 'The template ID to use for all rows in the CSV',
      },
      {
        displayName: 'CSV Data',
        name: 'csvData',
        type: 'string',
        typeOptions: { rows: 6 },
        default: '',
        required: true,
        displayOptions: { show: { resource: ['batch'], operation: ['submit'] } },
        description:
          'CSV content with a header row matching template field keys (e.g. heading,imageUrl). Max 1000 rows.',
      },

      // ── Batch: status ──
      {
        displayName: 'Job ID',
        name: 'jobId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['batch'], operation: ['status'] } },
        description: 'The batch job ID returned by the Submit operation',
      },

      // ── Batch: downloadFile ──
      {
        displayName: 'Job ID',
        name: 'jobId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['batch'], operation: ['downloadFile'] } },
        description: 'The batch job ID',
      },
      {
        displayName: 'File Name',
        name: 'fileName',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['batch'], operation: ['downloadFile'] } },
        description: 'File name from the job status "files" list (e.g. 1-my-title.png)',
      },
      {
        displayName: 'Output Binary Property',
        name: 'binaryProperty',
        type: 'string',
        default: 'data',
        required: true,
        displayOptions: { show: { resource: ['batch'], operation: ['downloadFile'] } },
        description: 'Name of the binary property to store the downloaded PNG in',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const credentials = await this.getCredentials('bulkTemplatesApi');
    const apiKey = credentials.apiKey as string;

    for (let i = 0; i < items.length; i++) {
      const resource = this.getNodeParameter('resource', i) as string;
      const operation = this.getNodeParameter('operation', i) as string;

      try {
        // ── Template ──
        if (resource === 'template') {
          if (operation === 'list') {
            const response = await this.helpers.request({
              method: 'GET',
              url: `${BASE_URL}/api/templates`,
              qs: { summary: '1' },
              headers: { 'x-api-key': apiKey },
              json: true,
            }) as { templates: IDataObject[] };
            const templates = response.templates ?? [];
            for (const tpl of templates) {
              returnData.push({ json: tpl as IDataObject, pairedItem: { item: i } });
            }
          } else if (operation === 'get') {
            const templateId = this.getNodeParameter('templateId', i) as string;
            const response = await this.helpers.request({
              method: 'GET',
              url: `${BASE_URL}/api/templates/${encodeURIComponent(templateId)}`,
              headers: { 'x-api-key': apiKey },
              json: true,
            }) as { template: IDataObject };
            returnData.push({ json: response.template ?? (response as IDataObject), pairedItem: { item: i } });
          }

        // ── Render ──
        } else if (resource === 'render') {
          const binaryProperty = this.getNodeParameter('binaryProperty', i) as string;
          const fieldDataStr = this.getNodeParameter('fieldData', i) as string;

          let fieldData: IDataObject = {};
          try {
            fieldData = JSON.parse(fieldDataStr || '{}') as IDataObject;
          } catch {
            throw new NodeOperationError(this.getNode(), 'Field Data must be valid JSON', { itemIndex: i });
          }

          const body: IDataObject = { data: fieldData };

          if (operation === 'renderById') {
            body.templateId = this.getNodeParameter('templateId', i) as string;
          } else if (operation === 'renderInline') {
            const templateJsonStr = this.getNodeParameter('templateJson', i) as string;
            try {
              body.template = JSON.parse(templateJsonStr) as IDataObject;
            } catch {
              throw new NodeOperationError(this.getNode(), 'Template JSON must be valid JSON', { itemIndex: i });
            }
          }

          const pngBuffer = await this.helpers.request({
            method: 'POST',
            url: `${BASE_URL}/api/render`,
            headers: {
              'x-api-key': apiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            encoding: null,
          }) as Buffer;

          const filename = `${(body.templateId as string | undefined) ?? 'image'}.png`;
          const binaryData = await this.helpers.prepareBinaryData(
            Buffer.from(pngBuffer),
            filename,
            'image/png',
          );

          returnData.push({
            json: { success: true, filename },
            binary: { [binaryProperty]: binaryData },
            pairedItem: { item: i },
          });

        // ── Batch ──
        } else if (resource === 'batch') {
          if (operation === 'submit') {
            const templateId = this.getNodeParameter('templateId', i) as string;
            const csvData = this.getNodeParameter('csvData', i) as string;

            const response = await this.helpers.request({
              method: 'POST',
              url: `${BASE_URL}/api/batch`,
              headers: { 'x-api-key': apiKey },
              formData: {
                templateId,
                csv: {
                  value: Buffer.from(csvData, 'utf-8'),
                  options: { filename: 'data.csv', contentType: 'text/csv' },
                },
              },
              json: true,
            }) as IDataObject;
            returnData.push({ json: response, pairedItem: { item: i } });

          } else if (operation === 'status') {
            const jobId = this.getNodeParameter('jobId', i) as string;
            const response = await this.helpers.request({
              method: 'GET',
              url: `${BASE_URL}/api/batch/${encodeURIComponent(jobId)}`,
              headers: { 'x-api-key': apiKey },
              json: true,
            }) as IDataObject;
            returnData.push({ json: response, pairedItem: { item: i } });

          } else if (operation === 'downloadFile') {
            const jobId = this.getNodeParameter('jobId', i) as string;
            const fileName = this.getNodeParameter('fileName', i) as string;
            const binaryProperty = this.getNodeParameter('binaryProperty', i) as string;

            const pngBuffer = await this.helpers.request({
              method: 'GET',
              url: `${BASE_URL}/api/batch/files/${encodeURIComponent(jobId)}/${encodeURIComponent(fileName)}`,
              headers: { 'x-api-key': apiKey },
              encoding: null,
            }) as Buffer;

            const binaryData = await this.helpers.prepareBinaryData(
              Buffer.from(pngBuffer),
              fileName,
              'image/png',
            );

            returnData.push({
              json: { jobId, fileName },
              binary: { [binaryProperty]: binaryData },
              pairedItem: { item: i },
            });
          }
        }
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: { error: (error as Error).message },
            pairedItem: { item: i },
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
