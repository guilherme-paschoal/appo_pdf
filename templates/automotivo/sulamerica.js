"use strict";

const pdf_path = '../../apolices/arquivos_automotivo/sulamerica/sulamerica1.pdf';
const pdfUtil = require("../../pdf-to-text/extract-text");
const extraction = require('../../pdf-to-text/extraction-helpers');
const helperFunc = require("../../pdf-to-text/helperFunc");

const options = {
  layout: '-simple',
  encoding: 'Latin1',
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

    result = extraction.readLineData(arr, "aplice n");
    json.policy.policyNumber = result.getCleanValue(0, "aplice n");

    result = extraction.readLineData(arr, "vigncia: ");
    let arrayOfDates = result.getValue(0, "vigncia: ").match(/(\d{2}\/\d{2}\/\d{4})/g);
    json.policy.startDateEffective = arrayOfDates[0];
    json.policy.endDateEffective = arrayOfDates[1];

    section = extraction.getArrayOfTextLinesInSection(arr, "dados do segurado", "veculo segurado");
    result = extraction.readLineData(section, "segurado: ");
    json.client.name = result.getValue(0, "segurado: ");
    result = extraction.readLineData(section, "cpf: ");
    json.client.id = result.getCleanValue(0,"cpf: ");

    result = extraction.readLineData(section, "end segurado: ");
    json.client.address.street = result.getValue(0, "end segurado: ");
    json.client.address.number = result.getValue(0, "end segurado: ").split(',')[1].trim().split(' ')[0];
    json.client.address.neigborhood = result.getValue(0, "end segurado: ").split('-')[1].trim();

    result = extraction.readLineData(section, "end segurado: ");
    json.client.address.street = result.getValue(0, "end segurado: ");
    result = extraction.readLineData(section, "cep: ");
    json.client.address.cep = result.getCleanValue(0, "cep: ");

    result = extraction.readLineData(section, "uf municpio de residncia/centro de atividades:");
    json.client.address.city = result.getValue(0, "uf municpio de residncia/centro de atividades:").split('-')[0];
    json.client.address.state = result.getValue(0, "uf municpio de residncia/centro de atividades:").split('-')[1];
    
    section = extraction.getArrayOfTextLinesInSection(arr, "veculo segurado", "garantias contratadas e prmios");
    result = extraction.readLineData(section, "veculo: ");
    json.policy.brand = result.getValue(0, "veculo: ").split('-')[0].trim();
    json.policy.model = result.getValue(0, "veculo: ").split('-')[1].trim();
    json.policy.yearManufacturing = result.getValue(0, "veculo: ").split('-')[2].trim().replace(/\D/g, '');;

    result = extraction.readLineData(section, "chassi: ");
    json.policy.chassis = result.getValue(0, "chassi: ");
    json.policy.plate = result.getValue(1, "placa: ");
    
    section = extraction.getArrayOfTextLinesInSection(arr, "garantias contratadas e prmios", "franquias e descontos");
    result = extraction.readLineData(section, "cobertura para terceiros (danos materiais)");
    json.policy.thirdPartyMaterialDamages = helperFunc.stringToNum(result.getValue(2));

    result = extraction.readLineData(section, "cobertura para terceiros (danos corporais)");
    json.policy.thirdPartyBodyDamages = helperFunc.stringToNum(result.getValue(2));

    result = extraction.readLineData(arr, "prmio total");
    json.policy.price = helperFunc.stringToNum(result.getValue(3));

    section = extraction.getArrayOfTextLinesInSection(arr, "franquias e descontos", "forma de pagamento do prmio");
    result = extraction.readLineData(section, "veculo:");
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