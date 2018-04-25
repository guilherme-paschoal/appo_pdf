"use strict";

const pdf_path = '../../apolices/arquivos_residencial/sura/sura1.pdf'; // ESSE CAMINHO DEVE SER "INICIADO" NO ROOT POIS O PDFTOTEXT PEGA A PARTIR DO ROOT
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

    section = extraction.getArrayOfTextLinesInSection(arr, "dados do segurado", "dados do seguro");
    result = extraction.readNextLineData(section, "segurado");
    json.client.name = result.getValue(0);
    result = extraction.readNextLineData(section, "cpf/cnpj");
    json.client.id = result.getCleanValue(0);

    json.client.address.fullAddress = result.getValue(1);
    let tempEndereco = result.getValue(1);

    let tempEnderecoSplit = tempEndereco.split(' - ');
    let tempEnderecoStreetSplit = tempEnderecoSplit[0].split(',');
    json.client.address.street = tempEnderecoStreetSplit[0];
    json.client.address.number = tempEnderecoStreetSplit[1] ? tempEnderecoStreetSplit[1] : "";

    if(tempEnderecoSplit.length == 5)
    {
      json.client.address.extra = tempEnderecoSplit[1];
      json.client.address.neighborhood = tempEnderecoSplit[2];
      json.client.address.city = tempEnderecoSplit[3];
      json.client.address.state = tempEnderecoSplit[4]; 
    }

    if(tempEnderecoSplit.length == 4)
    {
      json.client.address.neighborhood = tempEnderecoSplit[1];
      json.client.address.city = tempEnderecoSplit[2];
      json.client.address.state = tempEnderecoSplit[3]; 
    }

    result = extraction.readLineData(section, "cep: ");
    json.client.address.postalcode = result.getCleanValue(2, "cep: ");

    section = extraction.getArrayOfTextLinesInSection(arr, "dados do seguro", "dados do corretor");

    result = extraction.readNextLineData(section, "apólice||endosso");
    json.policy.policyNumber = result.getCleanValue(0);

    result = extraction.readLineData(section, "vigência do documento");
    let tempVigencia = result.values.join(' ');
    tempVigencia = parseDates(tempVigencia);
    let arrayOfDates = tempVigencia.match(/(\d{2}\/\d{2}\/\d{4})/g);
    json.policy.startDateEffective = arrayOfDates[0];
    json.policy.endDateEffective = arrayOfDates[1];

    result = extraction.readLineData(arr, 'premio total');
    json.policy.price = helperFunc.stringToNum(result.getValue(1));

    section = extraction.getArrayOfTextLinesInSection(arr, "locais de risco", "característica do risco");

    result = extraction.readLineData(section, "local 1:");

    let tempEnderecoRisco = '';

    if(result.getValue(1).trim() == "rua" || result.getValue(1).trim() == "avenida" || result.getValue(1).trim() == "alameda")
    {
      tempEnderecoRisco = result.getValue(1) + ' ' + result.getValue(2);
    } 
    else 
    {
      tempEnderecoRisco = result.getValue(1);
    }

    json.policy.riskFullAddress = tempEnderecoRisco;

    let tempEnderecoRiscoSplit = tempEnderecoRisco.split(' - ');
    let tempEnderecoRiscoStreetSplit = tempEnderecoRiscoSplit[0].split(',');
    json.policy.riskAddress = tempEnderecoRiscoStreetSplit[0];
    json.policy.riskStreetNumber = tempEnderecoRiscoStreetSplit[1] ? tempEnderecoRiscoStreetSplit[1] : "";

    if(tempEnderecoRiscoSplit.length == 6)
    {
      json.policy.riskAddressExtra = tempEnderecoRiscoSplit[1];
      json.policy.riskNeighborhood = tempEnderecoRiscoSplit[2];
      json.policy.riskCity = tempEnderecoRiscoSplit[3];
      json.policy.riskState = tempEnderecoRiscoSplit[4]; 
      json.policy.riskPostalCode = tempEnderecoRiscoSplit[5]; 
    }

    if(tempEnderecoRiscoSplit.length == 4)
    {
      json.policy.riskNeighborhood = tempEnderecoRiscoSplit[1];
      json.policy.riskCity = tempEnderecoRiscoSplit[2];
      json.policy.riskState = tempEnderecoRiscoSplit[3]; 
      json.policy.riskPostalCode = tempEnderecoRiscoSplit[4]; 
    }
    
    section = extraction.getArrayOfTextLinesInSection(arr, "cobertura(s)", "franquia / participação");

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

function parseDates(value)
{
  value = value.replace(/\sde\s/g,'/');
  value = value.replace(/janeiro/g,'01');
  value = value.replace(/fevereiro/g,'02');
  value = value.replace(/março/g,'03');
  value = value.replace(/abril/g,'04');
  value = value.replace(/maio/g,'05');
  value = value.replace(/junho/g,'06');
  value = value.replace(/julho/g,'07');
  value = value.replace(/agosto/g,'08');
  value = value.replace(/setembro/g,'09');
  value = value.replace(/outubro/g,'10');
  value = value.replace(/novembro/g,'11');
  value = value.replace(/dezembro/g,'12');
  return value;
}