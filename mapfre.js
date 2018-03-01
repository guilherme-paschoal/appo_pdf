"use strict";

const pdf_path = './arquivos_teste/pdf_por_seguradora/mapfre/mapfre1.pdf';
const pdfUtil = require("./patricio-pdf-to-text/extract-text");
const extraction = require('./extraction');
const helperFunc = require("./helperFunc");

const options = {
  layout: '-table',
  encoding: 'UTF-8',
  lineprinter: false,
  nodiagonal: true
};

pdfUtil.process(pdf_path, options, function (err, data) {

  extraction.generateFileFromString(data.toLowerCase());
  
  let arr = extraction.generateArrayOfTextLines();
  // arr = extraction.cleanLinesUp(arr);

  let json = { client: { address: {} }, policy: {
      insuranceId: "???????????????",
      typeOfpolicy: "car"
    },
  };

  if (err) {
    console.log("Não achei o arquivo");
    return err;
  }

  try {

    let result;
    let section;

    result = extraction.readNextLineData(arr, "ramo||produto||apólice nº||endosso||item");
    json.policy.policyNumber = result.getCleanValue(2);
    
    result = extraction.readNextLineData(arr, "vig.: início 24h do dia||término 24h do dia");
    let date = result.getValue(0).split('/');
    json.policy.startDateEffective = new Date(date[2] + "," + date[1] + "," + date[0]);    
    date = result.getValue(1).split('/');
    json.policy.endDateEffective = new Date(date[2] + "," + date[1] + "," + date[0]);    

    section = extraction.getArrayOfTextLinesInSection(arr, "dados do segurado", "telefone||telefone (outros)||telefone celular");
    result = extraction.readNextLineData(section, "nome");
    json.client.name = result.getValue(result.values.length - 1); 
    
    // Estou subtraindo o indice de length pois existem casos onde o modelo tem 1 pagina por folha e outros onde o modelo tem 2 paginas por folha
    // isso gera uma inconsistencia no layout do txt gerado, impossibilitando pegar o valor de um campo que estiver na segunda pagina da folha fornecedendo um indice igual nos outros campos
    // dessa maneira, eu pego o valor "de tras pra frente", garantindo o valor vir corretamente

    result = extraction.readNextLineData(section, "tipo de pessoa cpf||rg||expedição||orgão exp.");
    json.client.id = result.getCleanValue(result.values.length-4);

    result = extraction.readNextLineData(section, "endereço completo");
    json.client.address.street = result.getValue(result.values.length-1);
    json.client.address.number = json.client.address.street.replace(/[^\d|\s]/g, "").trim().split(' ')[0]; // Tenta obter o numero do endereco pegando o primeiro numeral que aparece no endereco
    
    result = extraction.readNextLineData(section, "bairro||cidade");
    json.client.address.neigborhood = result.getValue(result.values.length-2);
    json.client.address.city = result.getValue(result.values.length-1);

    result = extraction.readNextLineData(section, "cep||estado");
    json.client.address.cep = result.getCleanValue(result.values.length-2);
    json.client.address.state = result.getValue(result.values.length-1);

    json.client.address.email = "";

    // Aqui tem que ser SEM section mesmo 
    result = extraction.readNextLineData(arr, "telefone||telefone (outros)||telefone celular");
    json.client.phone = result.getCleanValue(result.values.length - 1);

    section = extraction.getArrayOfTextLinesInSection(arr, "dados do veículo", "acessórios e sistemas de segurança");

    result = extraction.readNextLineData(section, "marca / modelo");
    json.policy.brand = "";
    json.policy.model = result.getValue(result.values.length-1);

    result = extraction.readNextLineData(section, "ano fabricação / ano modelo||placa");
    json.policy.yearManufacturing = result.getValue(result.values.length - 2).split('/')[0].trim();
    json.policy.modelYear = result.getValue(result.values.length - 2).split('/')[1].trim();
    json.policy.plate = result.getValue(result.values.length - 1).replace('-','');

    // ----------------
    // Processamento mais "cru" devido a possibilidade do campo "n chassi" estar na segunda folha e o campo "renavam" poder estar vazio ou nao
    let tempIndex = extraction.getLineIndexWithText(arr, "nº chassi||renavam||chassi remarcado");
    let tempColumn = extraction.getDirtyArray()[tempIndex].indexOf("nº chassi");
    json.policy.chassis = extraction.getWordAt(extraction.getDirtyArray()[tempIndex + 1], tempColumn);
    // ----------------

    result = extraction.readNextLineData(arr, "descrição||tipo||valor(r$)");
    json.policy.franchise = helperFunc.stringToNum(result.getValue(result.values.length-1));

    // ----------------
    // No modelo que usei para fazer este processamento, existiam duas linhas contendo "rcfv - danos materiais" na mesma seção. 
    // Por isso, foi preciso criar a funcao getLineIndexWithTextAt pois sabemos que caso hajam tanto 1 quanto 2 paginas por folha, o valor a ser extraido
    // poderá ser encontrado na posição 0 (primeira pagina à esquerda)
    section = extraction.getArrayOfTextLinesInSection(arr, "coberturas contratadas e valores máximos de indenização", "este contrato de seguro segue o que dispõem as condições gerais");
    tempIndex = extraction.getLineIndexWithTextAt(section, "rcfv - danos materiais", 0);
    result = extraction.getDataArrayByLineIndex(section, tempIndex);
    json.policy.thirdPartyMaterialDamages = helperFunc.stringToNum(result.getValue(1, "rcfv - danos materiais"));

    tempIndex = extraction.getLineIndexWithTextAt(section, "rcfv - danos corporais", 0);
    result = extraction.getDataArrayByLineIndex(section, tempIndex);
    json.policy.thirdPartyBodyDamages = helperFunc.stringToNum(result.getValue(1, "rcfv - danos corporais"));

    tempIndex = extraction.getLineIndexWithTextAt(section, "rcfv - danos morais/estéticos", 0);
    result = extraction.getDataArrayByLineIndex(section, tempIndex);
    json.policy.thirdPartyMoralDamages = helperFunc.stringToNum(result.getValue(1, "rcfv - danos morais/estéticos"));
    // ----------------

    result = extraction.readLineData(section, "classe de bônus");
    json.policy.bonusClass = result.getValue(0, "classe de bônus");

    result = extraction.readNextLineData(arr, "prêmio líquido||encargos||custo de emissão||iof||prêmio total");
    json.policy.price = helperFunc.stringToNum(result.getValue(result.values.length - 1));
    
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