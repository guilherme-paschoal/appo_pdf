"use strict";

const pdf_path = './arquivos_teste/pdf_por_seguradora/zurich/zurich1.pdf';
const pdfUtil = require("./patricio-pdf-to-text/extract-text");
const extraction = require('./extraction');
const helperFunc = require("./helperFunc");

const options = {
  layout: '-simple',
  encoding: 'UTF-8',
  lineprinter: false
};

const replaceMonthName = function(dateString) {
  return dateString.toLowerCase()
  .replace("janeiro","/01/")
  .replace("fevereiro","/02/")
  .replace("março","/03/")
  .replace("abriu","/04/")
  .replace("maio","/05/")
  .replace("junho","/06/")
  .replace("julho","/07/")
  .replace("agosto","/08/")
  .replace("setembro","/09/")
  .replace("outubro","/10/")
  .replace("novembro","/11/")
  .replace("dezembro","/12/");
}

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

    result = extraction.readLineData(arr, "apólice:");
    json.policy.policyNumber = result.getCleanValue(1, );

    result = extraction.readLineData(arr, "início:");
    let date = replaceMonthName(result.getValue(0, "início:").replace("24hs do dia", '').replace(/de/g, '').replace(/\s/g,'')).split('/');
    json.policy.startDateEffective = new Date(date[2] + "," + date[1] + "," + date[0]);
    date = replaceMonthName(result.getValue(1, "término:").replace("24hs do dia", '').replace(/de/g, '').replace(/\s/g,'')).split('/');
    json.policy.endDateEffective = new Date(date[2] + "," + date[1] + "," + date[0]);

    section = extraction.getArrayOfTextLinesInSection(arr, "dados do seguro", "dados do risco");
    result = extraction.readLineData(section, "nome completo:");
    json.client.name = result.getValue(0, "nome completo:");

    result = extraction.readLineData(section, "cpf:");
    json.client.id = result.getCleanValue(0, "cpf:");

    result = extraction.readLineData(section, "endereço:");
    json.client.address.street = result.getValue(0, "endereço:");

    result = extraction.readLineData(section, "número:");
    json.client.address.number = result.getValue(0, "número:");
    json.client.address.neigborhood = result.getValue(2, "bairro:");

    result = extraction.readLineData(section, "cidade:");
    json.client.address.city = result.getValue(0, "cidade:");
    json.client.address.state = result.getValue(1, "uf:");
    json.client.address.cep = result.getCleanValue(2, "cep:");

    section = extraction.getArrayOfTextLinesInSection(arr, "dados do risco", "questionário perfil condutor principal");
    result = extraction.readLineData(section, "chassi:");
    json.policy.chassis = result.getValue(1, "chassi:");

    result = extraction.readLineData(section, "veículo:");
    json.policy.model = result.getValue(0,"veículo:");
    let tempArray = result.getValue(1, "ano / modelo:").split(" / ");
    json.policy.yearManufacturing = tempArray[0].trim();
    json.policy.modelYear = tempArray[0].trim();
    if(tempArray.length > 1) { json.policy.modelYear = tempArray[1].trim(); }

    json.policy.brand = '';

    result = extraction.readLineData(section, "placa:");
    json.policy.plate = result.getValue(0, "placa:");

    result = extraction.readLineData(section, "classe de bônus:");
    json.policy.bonusClass = result.getCleanValue(0, "classe de bônus:");

    section = extraction.getArrayOfTextLinesInSection(arr, "descrição||lmg (r$)||franquia (r$)||prêmio (r$)", "plano de pagamento do prêmio");
    result = extraction.readLineData(section, "veículo - colisão/incêndio/roubo");
    json.policy.franchise = helperFunc.stringToNum(result.getValue(2).replace(/[^\d,.]/g,''));

    result = extraction.readLineData(section, "rcv - danos corporais");
    json.policy.thirdPartyBodyDamages = helperFunc.stringToNum(result.getValue(1));

    result = extraction.readLineData(section, "rcv - danos materiais");
    json.policy.thirdPartyMaterialDamages = helperFunc.stringToNum(result.getValue(1));

    result = extraction.readLineData(section, "rcv - danos morais");
    json.policy.thirdPartyMoralDamages = helperFunc.stringToNum(result.getValue(1));

    result = extraction.readLineData(section, "prêmio à vista||r$");
    json.policy.price = helperFunc.stringToNum(result.getValue(2));

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