import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { execFile } from 'child_process';
import { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';

function escapePath(filePath: string): string {
  return filePath.replace(/(["\s'$`\\])/g, '\\$1');
}

async function convertPdfToImages(pdfPath: string, outputFolder: string): Promise<void> {
  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pageCount = pdfDoc.getPageCount();

  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  for (let i = 0; i < pageCount; i++) {
    const pdfPopplerCmd = '/usr/bin/pdftocairo';
    const pdfPopplerArgs = [
      '-jpeg',
      '-f',
      (i + 1).toString(),
      '-l',
      (i + 1).toString(),
      '-scale-to',
      '2000',
      escapePath(pdfPath),
      escapePath(path.join(outputFolder, `page_${i + 1}`)),
    ];

    await new Promise<void>((resolve, reject) => {
      execFile(pdfPopplerCmd, pdfPopplerArgs, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  console.log(`Converted ${pageCount} pages to images for ${pdfPath}`);
}

class CustomPdfToImages implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Custom PDF to Images',
    name: 'customPdfToImages',
    group: ['transform'],
    version: 1,
    description: 'Converts PDF pages to images',
    defaults: {
      name: 'Custom PDF to Images',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'PDF File Path',
        name: 'pdfFilePath',
        type: 'string',
        default: '',
        placeholder: 'Path to the PDF file',
        required: true,
        description: 'The path to the PDF file to be converted',
      },
      {
        displayName: 'Output Folder Path',
        name: 'outputFolderPath',
        type: 'string',
        default: '',
        placeholder: 'Path to the output folder',
        required: true,
        description: 'The path to the folder where images will be saved',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const pdfFilePath = this.getNodeParameter('pdfFilePath', 0) as string;
    const outputFolderPath = this.getNodeParameter('outputFolderPath', 0) as string;

    for (let i = 0; i < items.length; i++) {
      await convertPdfToImages(pdfFilePath, outputFolderPath);
    }

    return this.prepareOutputData(items);
  }
}

export { CustomPdfToImages };
