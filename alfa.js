"use strict";

const pdf_path = './arquivos_teste/pdf_por_seguradora/alfa/alfa1.pdf';
const pdfUtil = require("./patricio-pdf-to-text/extract-text");
const extraction = require('./extraction');
const helperFunc = require("./helperFunc");

const options = {
  layout: '-simple',
  encoding: 'UTF-8',
  lineprinter: false
};

pdfUtil.process(pdf_path, options, function (err, data) {

  extraction.generateFileFromString(data.toLowerCase());
  
  let arr = extraction.generateArrayOfTextLines();
  arr = extraction.cleanLinesUp(arr);

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

    section = extraction.getArrayOfTextLinesInSection(arr, "dados da apólice", "informações cadastrais");
    result = extraction.readLineData(section, "apólice: ");
    json.policy.policyNumber = result.getCleanValue(0, "apólice: ");
    
    result = extraction.readLineData(section, "vigência do seguro: ");
    let dates = result.getValue(0,"vigência do seguro: ").split(' até as ');
    let date = dates[0].replace('das 24:00h de', '').trim().split('/');
    json.policy.startDateEffective = new Date(date[2] + "," + date[1] + "," + date[0]);
    date = dates[1].replace('24:00h de', '').trim().split('/');
    json.policy.endDateEffective = new Date(date[2] + "," + date[1] + "," + date[0]);

    result = extraction.readLineData(section, "classe de bônus: ");
    json.policy.bonusClass = result.getValue(0,"classe de bônus: ");

    section = extraction.getArrayOfTextLinesInSection(arr, "informações cadastrais", "informações do veículo segurado");
    result = extraction.readLineData(section, "cpf: ");
    json.client.id = result.getCleanValue(1,"cpf: ");
    json.client.name = result.getValue(0, "segurado: ");

    result = extraction.readLineData(section, "endereço: ");
    json.client.address.street = result.getValue(0, "endereço: ");
    json.client.address.number = result.getValue(1, "número: ");

    result = extraction.readLineData(section, "cidade: ");
    let temp = result.getValue(0, "cidade: ").split('-');
    json.client.address.city = temp[0];
    json.client.address.neigborhood = temp[1];
    json.client.address.state = result.getValue(1, "uf: ");
    json.client.address.cep = result.getCleanValue(2, "cep: ");

    result = extraction.readLineData(section, "e-mail: ");
    json.client.address.email = result.getValue(0, "e-mail: ");
    json.client.phone = result.getCleanValue(1, "fone res/coml: ");

    section = extraction.getArrayOfTextLinesInSection(arr, "informações do veículo segurado", "coberturas e serviços");
    result = extraction.readLineData(section, "veículo: ");
    json.policy.brand = result.getValue(0, "veículo: ").split(' ')[0].trim();
    json.policy.model = result.getValue(0, "veículo: ").split(json.policy.brand)[1].trim();
    json.policy.yearManufacturing = result.getValue(1, "ano: ").split('/')[0].trim();
    json.policy.modelYear = result.getValue(1, "ano: ").split('/')[1].trim();

    result = extraction.readLineData(section, "chassi: ");
    json.policy.chassis = result.getValue(0, "chassi: ");
    json.policy.plate = result.getValue(1, "placa: ");
    
    result = extraction.readNextLineData(arr, "coberturas||tipo||valor (r$)");
    if(parseFloat(result.getValue(1))) { 
      json.policy.franchise = helperFunc.stringToNum(result.getValue(1));
    } else {
      json.policy.franchise = helperFunc.stringToNum(result.getValue(2));
    }

    section = extraction.getArrayOfTextLinesInSection(arr, "coberturas e serviços", "tabela de franquia");

    result = extraction.readLineData(section, "rcfv - danos materiais");
    json.policy.thirdPartyMaterialDamages = helperFunc.stringToNum(result.getValue(1));

    result = extraction.readLineData(section, "rcfv - danos corporais");
    json.policy.thirdPartyBodyDamages = helperFunc.stringToNum(result.getValue(1));

    result = extraction.readLineData(section, "rcfv - danos morais e estéticos");
    json.policy.thirdPartyMoralDamages = helperFunc.stringToNum(result.getValue(1));

    result = extraction.readLineData(arr, "valor total do seguro");
    json.policy.price = helperFunc.stringToNum(result.getValue(1));

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