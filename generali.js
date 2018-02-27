"use strict";

const pdf_path = './arquivos_teste/pdf_por_seguradora/generali/generali1.pdf';
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

    section = extraction.getArrayOfTextLinesInSection(arr, "dados do seguro", "dados do estipulante");
    result = extraction.readNextLineData(section, "produto||sucursal||proposta nº||código de identificação");
    json.policy.policyNumber = result.getCleanValue(2);

    result = extraction.readNextLineData(section, "vigência||contrato");
    let dates = result.getValue(0).split(' até 24 horas do dia ');
    let date = dates[0].replace('das 24 horas do dia', '').trim().split('/');
    json.policy.startDateEffective = new Date(date[2] + "," + date[1] + "," + date[0]);
    date = dates[1].trim().split('/');
    json.policy.endDateEffective = new Date(date[2] + "," + date[1] + "," + date[0]);

    section = extraction.getArrayOfTextLinesInSection(arr, "dados do segurado", "endereço de cobrança");
    result = extraction.readNextLineData(section, "nome||código do segurado||cnpj / cpf||cademp||tipo de pessoa");
    json.client.id = result.getCleanValue(2);
    json.client.name = result.getValue(0);

    result = extraction.readNextLineData(section, "endereço||complemento||país emissão passaporte");
    let temp = result.getValue(0) + " " + result.getValue(1);
    json.client.address.street = temp;
    let tempArr = result.getValue(0).split(',');
    if(tempArr.length > 0) {
      json.client.address.number = tempArr[1];
    }

    result = extraction.readNextLineData(section, "bairro||cidade||estado||cep||telefone");
    json.client.address.neigborhood = result.getValue(0);
    json.client.address.city = result.getValue(1);
    json.client.address.state = result.getValue(2);
    json.client.address.cep = result.getCleanValue(3);
    json.client.phone = result.getCleanValue(4);
    json.client.address.email = "";

    section = extraction.getArrayOfTextLinesInSection(arr, "dados do risco", "coberturas contratadas (expresso em reais)");
    result = extraction.readLineData(section, "veículo marca/tipo:");
    json.policy.brand = result.getValue(1).split(' ')[0].trim();
    json.policy.model = result.getValue(1).split(json.policy.brand)[1].trim();

    result = extraction.readLineData(section, "ano fabricação / modelo:");
    json.policy.yearManufacturing = result.getValue(3, "ano fabricação / modelo:").split('/')[0].trim();
    json.policy.modelYear = result.getValue(3, "ano fabricação / modelo:").split('/')[1].trim();

    result = extraction.readLineData(section, "chassi:");
    json.policy.chassis = result.getValue(0, "chassi:");

    result = extraction.readLineData(section, "placa:");
    json.policy.plate = result.getValue(3, "placa:");

    section = extraction.getArrayOfTextLinesInSection(arr, "coberturas contratadas (expresso em reais)", "cláusulas especiais e serviços contratados");
    result = extraction.readNextLineData(section, "coberturas básicas");
    json.policy.franchise = helperFunc.stringToNum(result.getValue(result.values.length-1));
    
    result = extraction.readLineData(section, "danos materiais");
    json.policy.thirdPartyMaterialDamages = helperFunc.stringToNum(result.getValue(1, "danos materiais"));

    result = extraction.readLineData(section, "danos corporais");
    json.policy.thirdPartyBodyDamages = helperFunc.stringToNum(result.getValue(1, "danos corporais"));

    result = extraction.readLineData(section, "danos morais provenientes de danos corporais");
    json.policy.thirdPartyMoralDamages = helperFunc.stringToNum(result.getValue(1, "danos morais provenientes de danos corporais"));

    section = extraction.getArrayOfTextLinesInSection(arr, "custo do seguro e serviços (expresso em reais)", "forma de pagamento (expresso em reais)");
    result = extraction.readLineData(section, "valor total:");
    json.policy.price = helperFunc.stringToNum(result.getValue(5));

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