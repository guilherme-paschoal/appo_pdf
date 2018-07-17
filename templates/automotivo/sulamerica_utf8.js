"use strict";

const pdf_path = '../../apolices/arquivos_automotivo/sulamerica/sulamerica3.pdf';
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

    result = extraction.readLineData(arr, "apólice n");
    json.policy.policyNumber = result.getCleanValue(0, "aplice n");

    result = extraction.readLineData(arr, "vigência: ");
    let arrayOfDates = result.getValue(0, "vigência: ").match(/(\d{2}\/\d{2}\/\d{4})/g);
    json.policy.startDateEffective = arrayOfDates[0];
    json.policy.endDateEffective = arrayOfDates[1];

    section = extraction.getArrayOfTextLinesInSection(arr, "dados do segurado", "veículo segurado");
    if(section.length == 0){
      section = extraction.getArrayOfTextLinesInSection(arr, "dados da segurada", "veículo segurado");
    }
    result = extraction.readLineData(section, "segurado: ");

    if(result.hasValues){
      json.client.name = result.getValue(0, "segurado: ");
    }
    else{
      result = extraction.readLineData(section, "segurada: ");
      json.client.name = result.getValue(0, "segurada: ");    
    }
   
    result = extraction.readLineData(section, "cpf: ");
    json.client.id = result.getCleanValue(0,"cpf: ");

    result = extraction.readLineData(section, "end segurado: ");
    if(result.hasValues){
      json.client.address.street = result.getValue(0, "end segurado: ");
      json.client.address.number = result.getValue(0, "end segurado: ").split(',')[1].trim().split(' ')[0];
      json.client.address.neigborhood = result.getValue(0, "end segurado: ").split('-')[1].trim();  
    }else{
      result = extraction.readLineData(section, "end segurada: ");
      json.client.address.street = result.getValue(0, "end segurada: ");
      json.client.address.number = result.getValue(0, "end segurada: ").split(',')[1].trim().split(' ')[0];
      json.client.address.neigborhood = result.getValue(0, "end segurada: ").split('-')[1].trim();
  
    }

    result = extraction.readLineData(section, "cep: ");
    json.client.address.cep = result.getCleanValue(0, "cep: ");

    result = extraction.readLineData(section, "uf município de residência/centro de atividades:");
    json.client.address.city = result.getValue(0, "uf município de residência/centro de atividades:").split('-')[0];
    json.client.address.state = result.getValue(0, "uf município de residência/centro de atividades:").split('-')[1];
    
    section = extraction.getArrayOfTextLinesInSection(arr, "veículo segurado", "garantias contratadas e prêmios");
    result = extraction.readLineData(section, "veículo: ");
    json.policy.brand = result.getValue(0, "veículo: ").split('-')[0].trim();
    json.policy.model = result.getValue(0, "veículo: ").split('-')[1].trim();
    json.policy.yearManufacturing = result.getValue(0, "veículo: ").split('-')[2].trim().replace(/\D/g, '');;

    result = extraction.readLineData(section, "chassi: ");
    json.policy.chassis = result.getValue(0, "chassi: ");
    json.policy.plate = result.getValue(1, "placa: ");
    
    section = extraction.getArrayOfTextLinesInSection(arr, "garantias contratadas", "franquias e descontos");
    result = extraction.readLineData(section, "cobertura para terceiros (danos materiais)");
    json.policy.thirdPartyMaterialDamages = helperFunc.stringToNum(result.getValue(2));

    result = extraction.readLineData(section, "cobertura para terceiros (danos corporais)");
    json.policy.thirdPartyBodyDamages = helperFunc.stringToNum(result.getValue(2));

    result = extraction.readLineData(arr, "prêmio total||-");
    json.policy.price = helperFunc.stringToNum(result.getValue(2));

    section = extraction.getArrayOfTextLinesInSection(arr, "franquias e descontos", "forma de pagamento do prêmio");
    result = extraction.readLineData(section, "veículo:");
    json.policy.franchise = helperFunc.stringToNum(result.getValue(1));
    json.policy.bonusClass = result.getValue(3).trim().replace(/\D/g, '');

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