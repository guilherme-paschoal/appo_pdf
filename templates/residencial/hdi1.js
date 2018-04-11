"use strict";

const pdf_path = '../../apolices/arquivos_residencial/hdi_1/hdi4.pdf'; // ESSE CAMINHO DEVE SER "INICIADO" NO ROOT POIS O PDFTOTEXT PEGA A PARTIR DO ROOT
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

    section = extraction.getArrayOfTextLinesInSection(arr, "hdi em casa", "corretor||inspetor");
    result = extraction.readLineData(section, "apólice");
    json.policy.policyNumber = result.getCleanValue(0, "apólice");

    result = extraction.readLineData(section, "segurado||: ");
    json.client.id = result.getCleanValue(3, ": ");
    json.client.name = result.getValue(1, ": ");

    result = extraction.readLineData(section, "endereço");
    json.client.address.street = result.getValue(1, ": ");

    try {
      let tempNumber = result.getValue(1, ": ");
      if (tempNumber.indexOf('/') >= 0) {
        tempNumber = tempNumber.split('/')[0].split(',')[1];
      } else {
        tempNumber = tempNumber.split(',')[1];
      }
      json.client.address.number = tempNumber.trim();
    } catch (err) {
      errjson.client.address.number = "";
    }

    json.client.phone = result.getCleanValue(3, ": ");

    result = extraction.readLineData(section, "bairro");
    json.client.address.neighborhood = result.getValue(1, ": ");

    result = extraction.readLineData(section, "cidade");
    tempSplit = result.getValue(1, ": ").split(' - ');
    json.client.address.city = tempSplit[0];
    json.client.address.state = tempSplit.length > 0 ? tempSplit[1].trim() : "";

    json.client.address.postalcode = result.getCleanValue(3, ": ");

    section = extraction.getArrayOfTextLinesInSection(arr, "informações do seguro", "conta prêmio da apólice");
    result = extraction.readLineData(section, "vigência: ");

    let arrayOfDates = result.getValue(1, "vigência: ").match(/(\d{2}\/\d{2}\/\d{4})/g);
    json.policy.startDateEffective = arrayOfDates[0];
    json.policy.endDateEffective = arrayOfDates[1];

    result = extraction.readLineData(arr, "prêmio total");
    json.policy.price = helperFunc.stringToNum((result.getValue(2)));

    result = extraction.readNextLineData(arr, "localização");
    tempSplit = result.getValue(0).split('000001 - ');

    if (tempSplit.length == 0) {
      tempSplit[0].trim();
    } else {
      json.policy.riskFullAddress = tempSplit[1].trim();

      try {
        tempSplit = tempSplit[1].split('-');
        json.policy.riskCity = tempSplit[1];
        json.policy.riskState = tempSplit[2];
        json.policy.riskPostalCode = tempSplit[3];

        tempSplit = tempSplit[0].split(',');
        json.policy.riskAddress = tempSplit[0];

        if (tempSplit[1].indexOf('/') > -1) {
          json.policy.riskStreetNumber = tempSplit[1].split('/')[0];

          let tempAfterNumber = tempSplit[1].split('/')[1];

          tempSplit.splice(0,1); // remove street address from the split array
          tempSplit.splice(0,1); // remove number from split array
          json.policy.riskAddressExtra = tempAfterNumber + ' ' + tempSplit.join(' '); // now, concatenates the rest to form the "complemento"
        } else
          json.policy.riskAddressExtra = tempSplit.join(' ');

      } catch (err) {

      }

    }

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