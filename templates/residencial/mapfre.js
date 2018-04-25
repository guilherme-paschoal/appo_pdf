"use strict";

const pdf_path = '../../apolices/arquivos_residencial/mapfre/mapfre3.pdf'; // ESSE CAMINHO DEVE SER "INICIADO" NO ROOT POIS O PDFTOTEXT PEGA A PARTIR DO ROOT
const pdfUtil = require("../../pdf-to-text/extract-text");
const extraction = require('../../pdf-to-text/extraction-helpers');
const helperFunc = require("../../pdf-to-text/helperFunc");
const validationHelper = require("../../pdf-to-text/validation-helpers");

const options = {
  layout: '-table',
  fixed: '2',
  encoding: 'UTF-8',
  lineprinter: false
};
//karollimaab
pdfUtil.process(pdf_path, options, function (err, data) {

  if (err) {
    console.log("Não achei o arquivo");
    return err;
  }

  extraction.generateFileFromString(data.toLowerCase());
  const pageBreak = 'mapfre seguros gerais s.a. – cnpj 61.074.175/0001-38';
  let arr = extraction.generateArrayOfTextLinesForTwoPagesAtOnce(218, pageBreak);

  let json = {
    client: {
      address: {}
    },
    policy: {
      insuranceId: "???????????????",
      typeOfpolicy: "residencial"
    },
  };

  try {

    let result;
    let section;
    let tempSplit;

    result = extraction.readNextLineData(arr, "ramo||produto||apólice nº||endosso||item");
    json.policy.policyNumber = result.getCleanValue(2);

    result = extraction.readNextLineData(arr, "proposta||renova apólice nº||vig.: início 24h do dia||término 24h do dia");
    json.policy.startDateEffective = result.getValue(result.values.length -2);
    json.policy.endDateEffective =result.getValue(result.values.length - 1);

    section = extraction.getArrayOfTextLinesInSection(arr, "dados do segurado", "dados do risco");
    result = extraction.readNextLineData(section, "nome");
    json.client.name = result.getValue(0);

    result = extraction.readNextLineData(section, "cpf||rg");
    json.client.id = result.getCleanValue(1);

    result = extraction.readNextLineData(section, "endereço completo");
    json.client.address.street = result.getValue(0);

    result = extraction.readNextLineData(section, "bairro||cidade");
    json.client.address.neighborhood = result.getValue(0);
    json.client.address.city = result.getValue(1);

    result = extraction.readNextLineData(section, "cep||estado||telefone");
    json.client.address.postalcode = result.getCleanValue(0);
    json.client.address.state = result.getValue(1);
    json.client.phone = result.getValue(2);

    section = extraction.getArrayOfTextLinesInSection(arr, "dados do risco", "cláusula beneficiária");
    result = extraction.readNextLineData(section, "endereço");
    json.policy.riskAddress = result.getValue(0);

    result = extraction.readNextLineData(section, "bairro/cidade");
    json.policy.riskNeighborhood = result.getValue(0).split('/')[0];
    json.policy.riskCity = result.getValue(0).split('/')[1];

    result = extraction.readNextLineData(section, "cep||uf");
    json.policy.riskPostalCode = result.getCleanValue(0);
    json.policy.riskState = result.getValue(1);

    section = extraction.getArrayOfTextLinesInSection(arr, "demonstrativo do prêmio - valores em r$", "pagamento do prêmio - valores em r$");
    result = extraction.readNextLineData(section, "prêmio líquido||adicional||encargos custo de emissão||iof||prêmio total");
    json.policy.price = helperFunc.stringToNum(result.getValue(result.values.length-1));

    section = extraction.getArrayOfTextLinesInSection(arr, "coberturas contratadas e valores máximos de indenização", "custo de assistência - ");
    result = extraction.readNextLineData(section, "básica simples");
    json.policy.basicCoverage = helperFunc.stringToNum(result.getValue(0));

    result = extraction.readNextLineData(section, "danos elétricos");
    json.policy.electricalDamageCoverage = helperFunc.stringToNum(result.getValue(0));

    result = extraction.readNextLineData(section, "perda/pagamento de aluguel");  
    json.policy.rentLossCoverage = helperFunc.stringToNum(result.getValue(0));

    result = extraction.readNextLineData(arr, "roubo/furto");
    json.policy.theftCoverage = helperFunc.stringToNum(result.getValue(0));

    result = extraction.readNextLineData(arr, "vendaval/impacto veículo");
    json.policy.windCoverage = helperFunc.stringToNum(result.getValue(0));

    result = extraction.readNextLineData(arr, "quebra de vidros");
    json.policy.glassDamageCoverage = helperFunc.stringToNum(result.getValue(0));

    result = extraction.readNextLineData(arr, "resp civil - imóvel familiar");
    json.policy.civilResponsibilityCoverage = helperFunc.stringToNum(result.getValue(0));

    extraction.deleteTempFile();

    console.log(json);
    validationHelper.validateJsonFields(json, function (err, data) {
        console.log("Resultado de teste", err, data);
    });

  } catch (err) {
    console.log(err);
  }

});
