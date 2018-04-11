"use strict";

const pdf_path = '../../apolices/arquivos_residencial/sulamerica/sulamerica4.pdf'; // ESSE CAMINHO DEVE SER "INICIADO" NO ROOT POIS O PDFTOTEXT PEGA A PARTIR DO ROOT
const pdfUtil = require("../../pdf-to-text/extract-text");
const extraction = require('../../pdf-to-text/extraction-helpers');
const helperFunc = require("../../pdf-to-text/helperFunc");
const validationHelper = require("../../pdf-to-text/validation-helpers");

const options = {
  layout: '-simple',
  // fixed: '2',
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

    result = extraction.readLineData(arr, "segurado: ");
    json.client.name = result.getValue(0, "segurado: ");

    result = extraction.readLineData(arr, "cpf: ");
    json.client.id = result.getCleanValue(1, "cpf: ");

    result = extraction.readLineData(arr, "end segurado: ");
    let tempEnderecoSegurado = result.getValue(0, "end segurado: ");
    
    result = extraction.readNextLineData(arr, "end segurado: ");
    tempEnderecoSegurado += ' ' + result.getValue(0);

    let tempEnderecoSeguradoSplit = tempEnderecoSegurado.split(' - ');
    json.client.address.neighborhood = tempEnderecoSeguradoSplit[1] ? tempEnderecoSeguradoSplit[1] : "";
    json.client.address.city = tempEnderecoSeguradoSplit[2] ? tempEnderecoSeguradoSplit[2] : "";
    json.client.address.state = tempEnderecoSeguradoSplit[3] ? tempEnderecoSeguradoSplit[3] : "";
    json.client.address.postalcode = tempEnderecoSeguradoSplit[4] ? tempEnderecoSeguradoSplit[4] : "";

    let tempEnderecoSeguradoStreetSplit = tempEnderecoSeguradoSplit[0].split(',');
    json.client.address.street = tempEnderecoSeguradoStreetSplit[0];
    json.client.address.number = tempEnderecoSeguradoStreetSplit[1] ? tempEnderecoSeguradoStreetSplit[1] : "";
    json.client.address.addressextra = tempEnderecoSeguradoStreetSplit[2] ? tempEnderecoSeguradoStreetSplit[2] : "";

    result = extraction.readLineData(arr, "apólice nº: ");
    json.policy.policyNumber = result.getCleanValue(0, "apólice nº: ");

    result = extraction.readLineData(arr, "vigência: ");
    let tempVigencia = result.getValue(0,"vigência: ");

    result = extraction.readNextLineData(arr, "vigência: ");
    tempVigencia += ' ' + result.getValue(0);

    let arrayOfDates = tempVigencia.match(/(\d{2}\/\d{2}\/\d{4})/g);
    json.policy.startDateEffective = arrayOfDates[0];
    json.policy.endDateEffective = arrayOfDates[1];

    section = extraction.getArrayOfTextLinesInSection(arr, "imóvel segurado", "categoria: ");
    let tempEnderecoRisco = "";

    for(let i = 0; i< section.length; i++)
      tempEnderecoRisco += section[i];
    
    tempEnderecoRisco.replace("end. do risco: ", '');

    let tempEnderecoRiscoSplit = tempEnderecoRisco.split(' - ');
    json.policy.riskCity = tempEnderecoRiscoSplit[1] ? tempEnderecoRiscoSplit[1] : "";
    json.policy.riskState = tempEnderecoRiscoSplit[2] ? tempEnderecoRiscoSplit[2] : "";
    json.policy.riskPostalCode = tempEnderecoRiscoSplit[3] ? tempEnderecoRiscoSplit[3] : "";

    let tempEnderecoRiscoStreetSplit = tempEnderecoRiscoSplit[0].split(',');
    json.policy.riskNeighborhood = tempEnderecoRiscoStreetSplit[tempEnderecoRiscoStreetSplit.length - 1] ? tempEnderecoRiscoStreetSplit[tempEnderecoRiscoStreetSplit.length - 1]  : "";
    json.policy.riskAddress = tempEnderecoRiscoStreetSplit[0].replace('end. do risco', '');
    json.policy.riskStreetNumber = tempEnderecoRiscoStreetSplit[1] ? tempEnderecoRiscoStreetSplit[1].match(/\d+/g)[0] : "";
    json.policy.riskAddressExtra =  tempEnderecoRiscoStreetSplit[1] ? tempEnderecoRiscoStreetSplit[1].replace(/\d+/g, '').trim() : "";

    result = extraction.readLineData(arr, "prêmio total:");
    json.policy.price = helperFunc.stringToNum(result.getValue(2));

    result = extraction.readNextLineData(arr, "incendio / explosao / raios / tumultos");
    json.policy.basicCoverage = helperFunc.stringToNum(result.getValue(1));

    result = extraction.readNextLineData(arr, "danos eletricos");
    json.policy.electricalDamageCoverage = helperFunc.stringToNum(result.getValue(1));

    result = extraction.readNextLineData(arr, "responsabilidade civil familiar");
    json.policy.civilResponsibilityCoverage = helperFunc.stringToNum(result.getValue(1));

    result = extraction.readNextLineData(arr, "roubo ou furto qualificado do conteudo");
    json.policy.theftCoverage = helperFunc.stringToNum(result.getValue(1));

    result = extraction.readNextLineData(arr, "quebra de vidros, marmores e granitos");
    json.policy.glassDamageCoverage = helperFunc.stringToNum(result.getValue(1));

    result = extraction.readNextLineData(arr, "vendaval, furacao, ciclone, tornado, granizo, fumaca");
    json.policy.windDamageCoverage = helperFunc.stringToNum(result.getValue(1));

   extraction.deleteTempFile();

    console.log(json);
    validationHelper.validateJsonFields(json, function (err, data) {
        console.log("Resultado de teste", err, data);
    });

  } catch (err) {
    console.log(err);
  }

});