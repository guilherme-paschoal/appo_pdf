"use strict";

const pdf_path = './apolices/arquivos_residencial/alianz/alianz1.pdf'; // ESSE CAMINHO DEVE SER "INICIADO" NO ROOT POIS O PDFTOTEXT PEGA A PARTIR DO ROOT
const pdfUtil = require("../../pdf-to-text/extract-text");
const extraction = require('../../pdf-to-text/extraction-helpers');
const helperFunc = require("../../pdf-to-text/helperFunc");

const options = {
  layout: '-table',
  encoding: 'UTF-8',
  lineprinter: false
};

pdfUtil.process(pdf_path, options, function (err, data) {

  extraction.generateFileFromString(data.toLowerCase());
  
  let arr = extraction.generateArrayOfTextLines();

  let json = { client: { address: {} }, policy: {
      insuranceId: "???????????????",
      typeOfpolicy: "residencial"
    },
  };

  if (err) {
    console.log("Não achei o arquivo");
    return err;
  }

  try
  {

  let result;
  let section;

  result = extraction.readLineData(arr, "nº apólice: ");
  json.policy.policyNumber = result.getCleanValue(0, "apólice: ");

  } 
  catch (err) {
    console.log(err);
  }

});