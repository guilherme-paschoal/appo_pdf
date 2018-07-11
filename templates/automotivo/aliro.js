"use strict";

const pdf_path = '../../apolices/arquivos_automotivo/aliro/aliro3.pdf';
const pdfUtil = require("../../pdf-to-text/extract-text");
const extraction = require('../../pdf-to-text/extraction-helpers');
const helperFunc = require("../../pdf-to-text/helperFunc");

const options = {
  layout: '-simple',
  encoding: 'UTF-8',
  lineprinter: false
};

pdfUtil.process(pdf_path, options, function (err, data) {

  extraction.generateFileFromString(data.toLowerCase());
  
  let arr = extraction.generateArrayOfTextLines();

  let json = { client: { address: {} }, policy: {
      insuranceId: "???????????????",
      typeOfpolicy: "car"
    },
  };

  if (err) {
    console.log("Não achei o arquivo");
    return err;
  }

  let result;
  let section;

  try {

    section = extraction.getArrayOfTextLinesInSection(arr, "dados do(a) segurado(a)", "dados da apólice");
    result = extraction.readNextLineData(section, "nome do(a) segurado(a)||cpf/cnpj");
    json.client.id = result.getCleanValue(1);
    json.client.name = result.getValue(0);

    result = extraction.readNextLineData(section, "endereço");
    json.client.address.street = result.getValue(0);

    if(result.getValue(0).indexOf(',') > -1){
      json.client.address.number = result.getValue(0).split(',')[1].trim().split(' ')[0];
    }

    result = extraction.readNextLineData(section, "bairro||cep||e-mail");
    json.client.address.neigborhood = result.getValue(0);
    json.client.address.cep = result.getCleanValue(1);
    json.client.address.email = result.getValue(2);

    result = extraction.readNextLineData(section, "cidade||uf||telefone/fax");
    json.client.address.city = result.getValue(0);
    json.client.address.state = result.getValue(1);
    json.client.phone = result.getCleanValue(2);

    section = extraction.getArrayOfTextLinesInSection(arr, "dados da apólice", "demonstrativo de prêmio");

    result = extraction.readNextLineData(section, "apólice");
    json.policy.policyNumber = result.getCleanValue(0);

    result = extraction.readNextLineData(section, "vigência do seguro");
    let arrayOfDates = result.getValue(0).match(/(\d{2}\/\d{2}\/\d{4})/g);
    json.policy.startDateEffective = arrayOfDates[0];
    json.policy.endDateEffective = arrayOfDates[1];

    section = extraction.getArrayOfTextLinesInSection(arr, "demonstrativo de prêmio", "forma de pagamento");
    result = extraction.readNextLineData(section, "prêmio total (r$)");
    json.policy.price = helperFunc.stringToNum(result.getValue(4));

    section = extraction.getArrayOfTextLinesInSection(arr, "item 001 - dados do veículo", "dados do seguro/cobertura");
  
    result = extraction.readNextLineData(section, "marca/tipo do veículo");
    json.policy.model = result.getValue(0).split('-')[1].trim();
    json.policy.yearManufacturing = result.getValue(2).split('/')[0];
    json.policy.modelYear = result.getValue(2).split('/')[1];

    result = extraction.readNextLineData(section, "chassi||placa||capacidade||categoria");
    json.policy.chassis = result.getValue(0);
    json.policy.plate = result.getValue(1);
    
    result = extraction.readNextLineData(section, "classe bônus");
    json.policy.bonusClass = result.getValue(0);

    section = extraction.getArrayOfTextLinesInSection(arr, "dados do seguro/cobertura", "informações complementares");

    result = extraction.readNextLineData(section, "coberturas contratadas||lmi (r$)||prêmio (r$)||franquia (r$)");
    json.policy.franchise = helperFunc.stringToNum(result.getValue(3));
    result = extraction.readLineData(section, "resp civil facultativo danos materiais");
    json.policy.thirdPartyMaterialDamages = helperFunc.stringToNum(result.getValue(1));

    result = extraction.readLineData(section, "resp civil facultativo danos corporais");
    json.policy.thirdPartyBodyDamages = helperFunc.stringToNum(result.getValue(1));

    result = extraction.readLineData(section, "resp civil facultativo danos morais");
    json.policy.thirdPartyMoralDamages = helperFunc.stringToNum(result.getValue(1));

    extraction.deleteTempFile();

    console.log(json);
    helperFunc.validateJsonFields(json, function (err, data) {
        console.log("Resultado de teste", err, data);
    });

  } 
  catch (err) {
    console.log(err);
  }

});