"use strict";

const pdf_path = '../../apolices/arquivos_residencial/liberty/liberty1.pdf'; // ESSE CAMINHO DEVE SER "INICIADO" NO ROOT POIS O PDFTOTEXT PEGA A PARTIR DO ROOT
const pdfUtil = require("../../pdf-to-text/extract-text");
const extraction = require('../../pdf-to-text/extraction-helpers');
const helperFunc = require("../../pdf-to-text/helperFunc");
const validationHelper = require("../../pdf-to-text/validation-helpers");

const options = {
  layout: '-table',
  encoding: 'UTF-8',
  lineprinter: false
};

pdfUtil.process(pdf_path, options, function (err, data) {

  extraction.generateFileFromString(data.toLowerCase());

  let arr = extraction.generateArrayOfTextLines();

  let json = {
    client: {
      address: {}
    },
    policy: {
      insuranceId: "???????????????",
      typeOfpolicy: "residencial"
    },
  };

  if (err) {
    console.log("Não achei o arquivo");
    return err;
  }

  try {

    let result;
    let section;
    let tempSplit;

    section = extraction.getArrayOfTextLinesInSection(arr, "dados do(a) segurado(a)", "dados da apólice");
    result = extraction.readNextLineData(section, "nome do(a) segurado(a)");
    json.client.name = result.getValue(0);
    json.client.id = result.getCleanValue(1);

    result = extraction.readNextLineData(section, "endereço");
    json.client.address.street = result.getValue(0);
    json.client.address.number = result.getValue(0).indexOf(',') ? result.getValue(0).split(',')[1].trim() : "";

    result = extraction.readNextLineData(section, "bairro||cep||e-mail");
    json.client.address.neighborhood = result.getValue(0);
    json.client.address.postalcode = result.getCleanValue(1);

    result = extraction.readNextLineData(section, "cidade||uf||telefone/fax");
    json.client.address.city = result.getValue(0);
    json.client.address.state = result.getValue(1);
    json.client.phone = result.getCleanValue(2);
    
    section = extraction.getArrayOfTextLinesInSection(arr, "dados da apólice", "demonstrativo de prêmio");

    result = extraction.readNextLineData(section, "apólice||endosso");
    json.policy.policyNumber = result.getCleanValue(0);

    result = extraction.readNextLineData(section, "vigência do seguro");
    let arrayOfDates = result.getValue(0).match(/(\d{2}\/\d{2}\/\d{4})/g);
    json.policy.startDateEffective = arrayOfDates[0];
    json.policy.endDateEffective = arrayOfDates[1];

    section = extraction.getArrayOfTextLinesInSection(arr, "demonstrativo de prêmio", "forma de pagamento");
    result = extraction.readNextLineData(section, "prêmio total (r$)");
    json.policy.price = helperFunc.stringToNum(result.getValue(result.values.length - 2));

    section = extraction.getArrayOfTextLinesInSection(arr, "item 001 - dados do local segurado", "dados do seguro/coberturas");

    result = extraction.readNextLineData(section, "endereço");
    json.policy.riskAddress = result.getValue(0);
    json.policy.riskStreetNumber = result.getValue(0).indexOf(',') ? result.getValue(0).split(',')[1].trim() : "";

    result = extraction.readNextLineData(section, "bairro||cidade||uf||cep");
    json.policy.riskNeighborhood = result.getValue(0);
    json.policy.riskCity = result.getValue(1);
    json.policy.riskState = result.getValue(2);
    json.policy.riskPostalCode = result.getCleanValue(3);
    
    section = extraction.getArrayOfTextLinesInSection(arr, "dados do seguro/coberturas", "informações complementares");

    result = extraction.readLineData(section, "incendio/");
    json.policy.basicCoverage = helperFunc.stringToNum(result.getValue(1));

    result = extraction.readLineData(section, "danos eletricos");
    json.policy.electricalDamageCoverage = helperFunc.stringToNum(result.getValue(1));

    result = extraction.readLineData(section, "roubo e/ou subtra");
    json.policy.theftCoverage = helperFunc.stringToNum(result.getValue(1));

    result = extraction.readLineData(section, "perda ou pagamento de");
    json.policy.rentLossCoverage = helperFunc.stringToNum(result.getValue(1));
  
    result = extraction.readLineData(section, "responsabilidade civil");
    json.policy.civilResponsibilityCoverage = helperFunc.stringToNum(result.getValue(1));

    extraction.deleteTempFile();

    console.log(json);
    validationHelper.validateJsonFields(json, function (err, data) {
        console.log("Resultado de teste", err, data);
    });

  } catch (err) {
    console.log(err);
  }

});