"use strict";

const pdf_path = '../../apolices/arquivos_residencial/porto/porto7.pdf'; // ESSE CAMINHO DEVE SER "INICIADO" NO ROOT POIS O PDFTOTEXT PEGA A PARTIR DO ROOT
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

  if (err) {
    console.log("Não achei o arquivo");
    return err;
  }

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

  try {

    let result;
    let section;
    let tempSplit;

    result = extraction.readNextLineData(arr, "renova apólice nº||apólice||nº||proposta nº||ramo||folha");
    json.policy.policyNumber = result.getCleanValue(1);

    result = extraction.readLineData(arr, "vigência do seguro:");
    let arrayOfDates = result.getValue(0).match(/(\d{2}\/\d{2}\/\d{4})/g);
    json.policy.startDateEffective = arrayOfDates[0];
    json.policy.endDateEffective = arrayOfDates[1];

    section = extraction.getArrayOfTextLinesInSection(arr, "dados do segurado", "dados do destinatário");

    result = extraction.readNextLineData(section, "nome");
    json.client.name = result.getValue(0);

    result = extraction.readNextLineData(section, "rg / rne / documento de classe");
    json.client.id = result.getCleanValue(result.values.length -1);

    result = extraction.readNextLineData(section, "endereço||bairro");
    json.client.address.street = result.getValue(0);
    json.client.address.neighborhood = result.getValue(1);

    tempSplit = result.getValue(0).split(' ');
    json.client.address.number = tempSplit[tempSplit.length-2];
    
    result = extraction.readNextLineData(section, "cidade||estado||cep");
    json.client.address.city = result.getValue(0);
    json.client.address.state = result.getValue(1);
    json.client.address.postalcode = result.getCleanValue(2);
    
    section = extraction.getArrayOfTextLinesInSection(arr, "dados do seguro", "coberturas contratadas e limites máximos de garantia(valores em reais)");
    result = extraction.readLineData(section, "local de risco:");
    let tempEnderecoRisco = result.getValue(0, "local de risco:");

    result = extraction.readNextLineData(section, "local de risco:");
    tempEnderecoRisco += result.getValue(0).indexOf('tipo de residência') > -1 ? "" : result.getValue(0);

    tempSplit = tempEnderecoRisco.split('-');
    json.policy.riskAddress = tempSplit[0].split(',')[0];

    if(tempSplit[0].indexOf(',') >- 1) { json.policy.riskStreetNumber = tempSplit[0].split(',')[1].trim(); }

    if(tempSplit.length >= 2) { json.policy.riskAddressExtra = tempSplit[1].trim(); }
    if(tempSplit.length >= 3) { json.policy.riskNeighborhood = tempSplit[2].trim(); }
    if(tempSplit.length >= 4) { json.policy.riskCity = tempSplit[3].trim(); }
    if(tempSplit.length >= 5) { json.policy.riskState = tempSplit[4].trim(); }
    if(tempSplit.length >= 6) { json.policy.riskPostalCode = tempSplit[5].replace(/[^0-9]/ig, "") };
    if(tempSplit.length >= 7) {  tempSplit[6].trim(); }

    //section = extraction.getArrayOfTextLinesInSection(arr, "coberturas contratadas e limites máximos de garantia(valores em reais)", "participação obrigatória do segurado");

    result = extraction.readLineData(arr, "incêndio, explosão e fumaça");
    if(result.values == null){ result = extraction.readLineData(arr, "incendio, explosao e fumaca"); }
    json.policy.basicCoverage = helperFunc.stringToNum(result.getValue(1));

    result = extraction.readLineData(arr, "danos eletricos");
    json.policy.electricalDamageCoverage = helperFunc.stringToNum(result.getValue(1));

    result = extraction.readLineData(arr, "vendaval");
    json.policy.windCoverage = helperFunc.stringToNum(result.getValue(1));

    result = extraction.readLineData(arr, "subtracao de bens");
    json.policy.theftCoverage = helperFunc.stringToNum(result.getValue(1));

    result = extraction.readLineData(arr, "responsabilidade civil familiar");
    json.policy.civilResponsibilityCoverage = helperFunc.stringToNum(result.getValue(1));

    result = extraction.readLineData(arr, "perda ou pagamento de aluguel");
    if(result.values == null){ result = extraction.readLineData(arr, "perda de aluguel"); }
    json.policy.rentLossCoverage = helperFunc.stringToNum(result.getValue(1));
  
    result = extraction.readLineData(arr, "preço total do seguro");
    json.policy.price = helperFunc.stringToNum(result.getValue(1));

    extraction.deleteTempFile();

    console.log(json);
    validationHelper.validateJsonFields(json, function (err, data) {
        console.log("Resultado de teste", err, data);
    });

  } catch (err) {
    console.log(err);
  }

});