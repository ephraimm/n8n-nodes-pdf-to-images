const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");
const { execFile } = require("child_process");

function escapePath(filePath) {
  return filePath.replace(/(["\s'$`\\])/g, "\\$1");
}

async function convertPdfToImages(pdfPath, outputFolder) {
  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pageCount = pdfDoc.getPageCount();

  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  for (let i = 0; i < pageCount; i++) {
    const outputFilePath = path.join(outputFolder, `page_${i + 1}.png`);
    const pdfPopplerCmd = "/usr/bin/pdftocairo";
    const pdfPopplerArgs = [
      "-png",
      "-f",
      (i + 1).toString(),
      "-l",
      (i + 1).toString(),
      "-scale-to",
      "2000",
      escapePath(pdfPath),
      escapePath(path.join(outputFolder, `page_${i + 1}`)),
    ];

    await new Promise((resolve, reject) => {
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

class CustomPdfToImages {
  description = {
    displayName: "Custom PDF to Images",
    name: "customPdfToImages",
    group: ["transform"],
    version: 1,
    description: "Converts PDF pages to images",
    defaults: {
      name: "Custom PDF to Images",
    },
    inputs: ["main"],
    outputs: ["main"],
    properties: [
      {
        displayName: "PDF File Path",
        name: "pdfFilePath",
        type: "string",
        default: "",
        placeholder: "Path to the PDF file",
        required: true,
        description: "The path to the PDF file to be converted",
      },
      {
        displayName: "Output Folder Path",
        name: "outputFolderPath",
        type: "string",
        default: "",
        placeholder: "Path to the output folder",
        required: true,
        description: "The path to the folder where images will be saved",
      },
    ],
  };

  async execute() {
    const items = this.getInputData();
    const pdfFilePath = this.getNodeParameter("pdfFilePath", 0);
    const outputFolderPath = this.getNodeParameter("outputFolderPath", 0);

    for (let i = 0; i < items.length; i++) {
      await convertPdfToImages(pdfFilePath, outputFolderPath);
    }

    return this.prepareOutputData(items);
  }
}

module.exports = { CustomPdfToImages };
