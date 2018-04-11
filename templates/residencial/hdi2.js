"use strict";

const pdf_path = './apolices/arquivos_residencial/hdi_2/hdi_2_1.pdf'; // ESSE CAMINHO DEVE SER "INICIADO" NO ROOT POIS O PDFTOTEXT PEGA A PARTIR DO ROOT
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

    result = extraction.readLineData(arr, "apólice: ");
    json.policy.policyNumber = result.getCleanValue(0, "apólice:");

    result = extraction.readLineData(arr, "vigência: ");
    let arrayOfDates = result.getValue(0, "vigência: ").match(/(\d{2}\/\d{2}\/\d{4})/g);
    json.policy.startDateEffective = arrayOfDates[0];
    json.policy.endDateEffective = arrayOfDates[1];

    result = extraction.readLineData(arr, "segurado: ");
    json.client.name = result.getValue(0, "segurado: ");

    result = extraction.readLineData(arr, "cpf/cnpj: ");
    json.client.id = result.getCleanValue(0, "cpf/cnpj: ");

    result = extraction.readLineData(arr, "endereço: ");
    json.client.address.street = result.getValue(0, "endereço: ");

    let tempArr = extraction.readNextMultiLineData(arr, "endereço: ", 3);
    json.client.address.neighborhood = tempArr[0].getValue(0);
    json.client.address.city = tempArr[1].getValue(0).indexOf('-') > -1 ? tempArr[1].getValue(0).split('-')[0].trim() : tempArr[1].getValue(0);
    json.client.address.state = tempArr[1].getValue(0).indexOf('-') > -1 ? tempArr[1].getValue(0).split('-')[1].trim() : "";
    json.client.address.postalcode = tempArr[2].getValue(0).replace('-','');

    section = extraction.getArrayOfTextLinesInSection(arr, "especificação do item contratado", "coberturas||l.m.i.||prêmios");
    result = extraction.readNextLineData(section, "endereço do imóvel segurado:");
    json.policy.riskFullAddress = result.getValue(0);
    json.policy.riskAddress = result.getValue(0).indexOf(',') > -1 ? result.getValue(0).split(',')[0] : result.getValue(0);
    json.policy.riskStreetNumber = result.getValue(0).indexOf(',') > -1 ? result.getValue(0).split(',')[1] : "";

    if(json.policy.riskStreetNumber.indexOf(' ')) {
      json.policy.riskStreetNumber = json.policy.riskStreetNumber.split(' ')[0];
      json.policy.riskAddressExtra =  json.policy.riskStreetNumber.split(' ')[1];
    }

    result = extraction.readLineData(arr, "cidade:");
    json.policy.riskCity = result.getValue(0, "cidade: ");
    json.policy.riskState = result.getValue(1, "uf: ");
    json.policy.riskPostalCode = result.getValue(2, "cep: ");

    result = extraction.readLineData(arr, "prêmio total:");
    json.policy.price = helperFunc.stringToNum(result.getValue(1));

    result = extraction.readLineData(arr, "incendio/raio/explosao/queda de aeronave");
    json.policy.basicCoverage = helperFunc.stringToNum(result.getValue(1));

    result = extraction.readLineData(arr, "perda ou pagto. de aluguel a terceiros");
    json.policy.rentLossCoverage = helperFunc.stringToNum(result.getValue(1));

    result = extraction.readLineData(arr, "danos eletricos");
    json.policy.electricalDamageCoverage = helperFunc.stringToNum(result.getValue(1));

    result = extraction.readLineData(arr, "quebra de vidros");
    json.policy.glassDamageCoverage = helperFunc.stringToNum(result.getValue(1));

    result = extraction.readLineData(arr, "ruptura de tubulacoes");
    json.policy.plumbingDamageCoverage = helperFunc.stringToNum(result.getValue(1));

    extraction.deleteTempFile();

    console.log(json);
    validationHelper.validateJsonFields(json, function (err, data) {
        console.log("Resultado de teste", err, data);
    });

  } catch (err) {
    console.log(err);
  }

});