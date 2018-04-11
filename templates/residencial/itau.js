"use strict";

const pdf_path = '../../apolices/arquivos_residencial/itau/itau3.pdf'; // ESSE CAMINHO DEVE SER "INICIADO" NO ROOT POIS O PDFTOTEXT PEGA A PARTIR DO ROOT
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


    result = extraction.readLineData(arr, "nr. apólice");
    json.policy.policyNumber = result.getCleanValue(0, "nr. apólice: ");

    let arrayOfDates = result.getValue(2, "vigência: ").match(/(\d{2}\/\d{2}\/\d{4})/g);
    json.policy.startDateEffective = arrayOfDates[0];
    json.policy.endDateEffective = arrayOfDates[1];

    section = extraction.getArrayOfTextLinesInSection(arr, "dados do segurado", "dados do imóvel segurado");
    result = extraction.readLineData(section, "nome: ");
    json.client.name = result.getValue(0, "nome: ");
    json.client.id = result.getCleanValue(1, "cpf/cnpj no: ");

    result = extraction.readLineData(section, "endereço");
    json.client.address.street = result.getValue(0, "endereço: ");

    if(result.getValue(1).indexOf('cep:') == -1)
      json.client.address.street += ' ' + result.getValue(1);
      
    json.client.address.number = json.client.address.street.match(/\d+/g)[0];
    
    if(json.client.address.street.indexOf('-') > -1) 
    {
      let stateSplit = json.client.address.street.split('-');
      json.client.address.state = stateSplit[1].trim();
     // json.client.address.neighborhood = stateSplit[0].trim();
    }
  
    json.client.address.postalcode = result.getCleanValue(result.values.length - 1, "cep: ");

    section = extraction.getArrayOfTextLinesInSection(arr, "dados do imóvel segurado", "dados do seguro");
    result = extraction.readLineData(section, "endereço: ");
    json.policy.riskAddress = result.getValue(0, "endereço: ");
    json.policy.riskStreetNumber = result.getValue(1, "nr.: ");
    
    result = extraction.readLineData(section, "bairro: ");
    json.policy.riskNeighborhood = result.getValue(0, "bairro: ");
    json.policy.riskAddressExtra = result.getValue(1, "complemento: ");

    result = extraction.readLineData(section, "cidade: ");
    json.policy.riskCity = result.getValue(0, "cidade: ");
    json.policy.riskState = result.getValue(1, "estado: ");

    section = extraction.getArrayOfTextLinesInSection(arr, "dados do seguro", "dados do pagamento");

    result = extraction.readLineData(arr, "incêndio/q.raio no");
    json.policy.basicCoverage = helperFunc.stringToNum(result.getValue(1).replace('r$',''));

    result = extraction.readLineData(arr, "roubo ou furto de bens");
    json.policy.theftCoverage = helperFunc.stringToNum(result.getValue(1).replace('r$',''));

    result = extraction.readLineData(arr, "vendaval e granizo");
    json.policy.windCoverage = helperFunc.stringToNum(result.getValue(1).replace('r$',''));

    result = extraction.readLineData(arr, "danos elétricos");
    json.policy.electricalDamageCoverage = helperFunc.stringToNum(result.getValue(1).replace('r$',''));

    result = extraction.readLineData(arr, "quebra de vidros");
    json.policy.glassDamageCoverage = helperFunc.stringToNum(result.getValue(1).replace('r$',''));

    result = extraction.readLineData(section, "resp. civil do morador");
    json.policy.civilResponsibilityCoverage = helperFunc.stringToNum(result.getValue(1));

    section = extraction.getArrayOfTextLinesInSection(arr, "dados do pagamento", "forma de pagamento");
    result = extraction.readNextLineData(section, "preço final do seguro");
    json.policy.price = helperFunc.stringToNum(result.getValue(4).replace('r$',''));

    extraction.deleteTempFile();

    console.log(json);
    validationHelper.validateJsonFields(json, function (err, data) {
        console.log("Resultado de teste", err, data);
    });

  } catch (err) {
    console.log(err);
  }

});