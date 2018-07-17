"use strict";

const pdf_path = '../../apolices/arquivos_automotivo/aliro/aliro5.pdf';
const pdfUtil = require("../../pdf-to-text/extract-text");
const helperFunc = require("../../pdf-to-text/helperFunc");

var newLineindicator = "<br>";
//Fields to process
/*CLIENT*/
var clientFields = ["nome do segurado </&&>cpf/cnpj","endereço", "bairro</&&>cep</&&>e-mail", "cidade</&&>uf</&&>telefone/fax"]
//POLICY
var policyFields = ["apólice</&&>endosso</&&>nº do contrato</&&>proposta", "vigência do seguro</&&>data de emissão</&&>quantidade de veículos "];

//PRICE
var priceFields = ["prêmio total"];

//VEHICLE
var vehicleFields = ["código fipe</&&>marca/tipo do veículo</&&>ano fab/mod", "chassi</&&>placa</&&>capacidade</&&>categoria", "classe bônus</&&>renovação da apólice/seguradora</&&>término de vigência"];
//COVERAGE
var coverageFields = ["basica 01-compreensiva","resp civil facultativo danos materiais","resp civil facultativo danos corporais","resp civil facultativo danos morais"  ]

//COVERAGE
// var serviceFields = ["para brisa:", "vigia", "lateral", "retrovisor externo"];

var options = {
    layout: '-simple',
    encoding: 'UTF-8',
    lineprinter: false
    //   endofline: 'unix',
    //    nodiagonal: true,
};


//    module.exports.run = function (pdfUtil, pdf_path, helperFunc, done) {
pdfUtil.process(pdf_path, options, function (err, data) {

    if (err) {
        console.log("Não achei o arquivo");
        return err;
    } else {

        var fieldName = '';
        var fIndex = 0;
        var ArrayString = [];
        var sectionText = '';
        var fullText = '';

        var json = {
            client: {
                address: {}
            },

            policy: {
                insuranceId: "???????????????",
                typeOfpolicy: "car"
            },

        };

        //replace new line with <br>
        //replace 2 white spaces with '</&&>'
        //replace parenthesis with white spaces (cant search with white space)
        fullText = data.replace(/\r?\n/g, newLineindicator).replace(/\s\s+/g, '</&&>').toLowerCase().replace(/<br><br>/g, "").replace(/[$]/g, "").replace(/0_<br>/g, "");
        fullText = fullText.replace(/ *\([^)]*\) */g, " ");


        /********************DADOS SEGURADO *******************/
        fieldName = 'dados do segurado';
        fIndex = fullText.indexOf(fieldName);
        ArrayString = [];

        sectionText = fullText.substring(fIndex, fIndex + fieldName.length + 316)

        sectionText = sectionText.replace(/ *\([^)]*\) */g, " ");
        clientFields.forEach(function (field) {
            var n = sectionText.search(field);
            
            if (n > -1) {
                switch (field) {
                    case "nome do segurado </&&>cpf/cnpj":

                        ArrayString = helperFunc.getThreeLineFields(field, sectionText, n, 400, newLineindicator);

                        if (ArrayString.length > 0) {
                            json.client.name = ArrayString[0].replace(/[^A-Z]/ig, " ");
                            json.client.id = ArrayString[1].replace(/[^A-Z0-9]/ig, "").replace(/\D/g, '');
                        }

                        break;
                    case "endereço":
                        ArrayString = helperFunc.getThreeLineFields(field, sectionText, n, 400, newLineindicator);

                        if (ArrayString.length > 0)
                        {
                            json.client.address.street = ArrayString[0].trim();
                            
                            var numbersInString = ArrayString[0].match(/^\d+|\d+\b|\d+(?=\w)/g);

                            if(numbersInString.length > 0) {
                                json.client.address.number = numbersInString[0];
                            }
                        }

                        break;
                    case "bairro</&&>cep</&&>e-mail":

                        ArrayString = helperFunc.getThreeLineFields(field, sectionText, n, 400, newLineindicator);

                        if (ArrayString.length > 0) {
                            json.client.address.neigborhood  = ArrayString[0].trim();
                            json.client.address.cep  = ArrayString[1].trim().replace(/[^A-Z0-9]/ig, "").replace(/\D/g, '');
                            json.client.address.email  = ArrayString[2].trim();
                        }

                        break;
                    case "cidade</&&>uf</&&>telefone/fax":
                        ArrayString = helperFunc.getThreeLineFields(field, sectionText, n, 400, newLineindicator);

                        if (ArrayString.length > 0) {
                            json.client.address.city  = ArrayString[0].trim();
                            json.client.address.state  = ArrayString[1].trim();
                            json.client.phone  = ArrayString[2].trim().replace(/[^A-Z0-9]/ig, "").replace(/\D/g, '');
                        }
                       break;

                }
            }

        });

        /***************** DADOS DA APOLICE *******************/
        fieldName = 'dados da apólice';
        fIndex = fullText.indexOf(fieldName);
        sectionText = fullText.substring(fIndex, fIndex + fieldName.length + 261)
        sectionText = sectionText.replace(/ *\([^)]*\) */g, " ");
        
        policyFields.forEach(function (field) {
            var n = sectionText.search(field);
            
            if (n > -1) {
                switch (field) {
                    case "apólice</&&>endosso</&&>nº do contrato</&&>proposta":

                        ArrayString = helperFunc.getThreeLineFields(field, sectionText, n, 400, newLineindicator);

                        if (ArrayString.length > 0) {
                            json.policy.policyNumber = ArrayString[0].replace(/[^A-Z0-9]/ig, "").replace(/\D/g, '').trim();
                            // json.policy.contractNumber = ArrayString[2].trim()
                            // json.policy.proposal =  ArrayString[3].trim()
                        }

                        break;
                    case "vigência do seguro</&&>data de emissão</&&>quantidade de veículos ":

                        ArrayString = helperFunc.getThreeLineFields(field, sectionText, n, 400, newLineindicator);

                        if (ArrayString.length > 0) {
                            var d = ArrayString[0].split(' às ')[0].replace('das 24:00hs de', '').trim().split("/");
                            json.policy.startDateEffective = new Date(d[2] + "," + d[1] + "," + d[0]);

                            d = ArrayString[0].split(' às ')[1].replace('24:00hs de ', '').trim().split("/");
                            json.policy.endDateEffective =  new Date(d[2] + "," + d[1] + "," + d[0]);
                        }

                        break;
                }
            }

        });

        /******************* DADOS DO VEICULO *****************/
        fieldName = 'item 001 - dados do veículo';
        fIndex = fullText.indexOf(fieldName);
        sectionText = fullText.substring(fIndex, fIndex + fieldName.length + 560)
        sectionText = sectionText.replace(/ *\([^)]*\) */g, " ");

        vehicleFields.forEach(function (field) {
            var n = sectionText.search(field);
            
            if (n > -1) {
                switch (field) {
                    case "código fipe</&&>marca/tipo do veículo</&&>ano fab/mod":

                        ArrayString = helperFunc.getThreeLineFields(field, sectionText, n, 110, newLineindicator);

                        if (ArrayString.length > 0) {
                            json.policy.model = ArrayString[1].trim()
                            json.policy.yearManufacturing = ArrayString[2].split('/')[0].trim();
                            json.policy.modelYear = ArrayString[2].split('/')[1].trim();
                        }

                        // This model doesn't have a brand field and they don't write the brand with the car model
                        json.policy.brand = 'N.I.';

                        break;
                    case "chassi</&&>placa</&&>capacidade</&&>categoria":

                        ArrayString = helperFunc.getThreeLineFields(field, sectionText, n, 100, newLineindicator);

                        if (ArrayString.length > 1) {
                            json.policy.chassis = ArrayString[0].trim()
                            json.policy.plate = ArrayString[1].trim();
                        }

                        break;
                 
                    case "classe bônus</&&>renovação da apólice/seguradora</&&>término de vigência":

                        ArrayString = helperFunc.getThreeLineFields(field, sectionText, n, 50, newLineindicator);

                        if (ArrayString.length > 0) {
                            json.policy.bonusClass = ArrayString[0].trim()
                        }

                        break;
                        
                }
            }
        });

        /************** COBERTURAS *************************/
//        var coverageFields = ["basica 01-compreensiva","resp civil facultativo danos materiais","resp civil facultativo danos corporais","resp civil facultativo danos morais"  ]

        fieldName = coverageFields[0];
        fIndex = fullText.search(fieldName);
        sectionText = fullText.substring(fIndex, fIndex + fieldName.length + 200);
        var n = sectionText.search(fieldName);
        var array =  helperFunc.getMultiColumnField(sectionText, n, '<br>');

        if(array.length > 0) {
            json.policy.franchise = helperFunc.stringToNum(array[3]);
        }

        fieldName = coverageFields[1];
        fIndex = fullText.search(fieldName);
        sectionText = fullText.substring(fIndex, fIndex + fieldName.length + 200);
        n = sectionText.search(fieldName);
        array =  helperFunc.getMultiColumnField(sectionText, n, '<br>');

        if(array.length > 0) {
            json.policy.thirdPartyMaterialDamages = helperFunc.stringToNum(array[1]);
        }

        fieldName = coverageFields[2];
        fIndex = fullText.search(fieldName);
        sectionText = fullText.substring(fIndex, fIndex + fieldName.length + 200);
        n = sectionText.search(fieldName);
        array =  helperFunc.getMultiColumnField(sectionText, n, '<br>');

        if(array.length > 0) {
            json.policy.thirdPartyBodyDamages = helperFunc.stringToNum(array[1]);
        }

        fieldName = coverageFields[3];
        fIndex = fullText.search(fieldName);
        sectionText = fullText.substring(fIndex, fIndex + fieldName.length + 200);
        n = sectionText.search(fieldName);
        array =  helperFunc.getMultiColumnField(sectionText, n, '<br>');

        if(array.length > 0) {
            json.policy.thirdPartyMoralDamages = helperFunc.stringToNum(array[1]);
        }



        /**************** PREMIO / VALOR SEGURO ***************/
        fieldName = 'demonstrativo de prêmio';
        fIndex = fullText.indexOf(fieldName);
        sectionText = fullText.substring(fIndex, fIndex + fieldName.length + 530)
        sectionText = sectionText.replace(/ *\([^)]*\) */g, " ");

        ArrayString = helperFunc.getThreeLineFields('prêmio total', sectionText, n, 110, newLineindicator);

        if (ArrayString.length > 0 && ArrayString[0] == "") {
            json.policy.price = helperFunc.stringToNum(ArrayString[5].trim());
        } else {
            json.policy.price = helperFunc.stringToNum(ArrayString[4].trim());
        }



        console.log(json);
        helperFunc.validateJsonFields(json, function (err, data) {
            console.log("Resultado de teste", err, data);
        });

    }
});

