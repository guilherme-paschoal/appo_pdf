//(function () {
"use strict";

const pdf_path = '../../apolices/arquivos_automotivo/mitsui/1 (1).pdf';
const pdfUtil = require("../../pdf-to-text/extract-text");
const extraction = require('../../pdf-to-text/extraction');
const helperFunc = require("../../pdf-to-text/helperFunc");

var newLineindicator = "<br>";
//Fields to process
/*CLIENT*/
var clientFields = ["endereço </&&>cep", "nome / razão social</&&>cpf / cnpj", "bairro</&&>cidade</&&>uf", "bairro:", "telefone<br>", "telefone</&&>", "e-mail:", "cidade:", "inicío: a partir das 24h de"];

//POLICY
var policyFields = ["apólice:", "classe de bônus:"];

//PRICE
var priceFields = ["prêmio líquido total juros</&&>custo de emissão</&&>iof</&&>prêmio total", "veículo"];

//VEHICLE
var vehicleFields = ["veículo<br>", "veículo</&&>", "ano modelo:", "ano de fabricação:", "fabricante:", "placa:", "ano / modelo</&&>placa</&&>chassi", "bônus - classe</&&>nº.ci"];

//COVERAGE
var coverFields = ["danos materiais", "danos corporais", "danos morais", "coberturas</&&>l.m.i r</&&>prêmio líquido</&&>franquia r", "prêmio total"];

//COVERAGE
var serviceFields = ["para brisa:", "vigia", "lateral", "retrovisor externo"];
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
        var json = {
            client: {
                address: {}
            },

            policy: {
                insuranceId: "33164021000100",
                typeOfpolicy: "car"
            },

        };

        //replace new line with <br>
        //replace 2 white spaces with '</&&>'
        //replace parenthesis with white spaces (cant serach with white space)
        var fullText = data.replace(/\r?\n/g, newLineindicator).replace(/\s\s+/g, '</&&>').toLowerCase().replace(/<br><br>/g, "").replace(/[$]/g, "").replace(/0_<br>/g, "");

        //                var tempText = data.replace(/\r?\n/g, newLineindicator).replace(/\s\s+/g, '</&&>').toLowerCase().replace(/<br><br>/g, "").replace(/[$]/g, "").replace(/0_<br>/g, "");
        //        console.log(fullText);
        //                var fullText = helperFunc.removeDiacritics(tempText);
        //        console.log(fullText)

        /********************APÒLICE***************************/
        var fieldName = "ms auto";
        var fIndex = fullText.search(fieldName);
        //        ////console.log(fIndex);
        var policyText = fullText.substring(fIndex, fIndex + fieldName.length + 100).replace("<br></&&>d<br>", ":");
        fieldName = "ms auto: ";
        fIndex = fullText.search(fieldName);
        json.policy.policyNumber = helperFunc.getField(fieldName, policyText, fIndex, 100).trim();
        //console.log(policyText)


        //COBERTURAS
        var fieldName = "coberturas</&&>l.m.i r</&&>prêmio líquido</&&>franquia r";
        var fIndex = fullText.search(fieldName);
        //        console.log("COBERTURAS", fIndex)
        var ArrayString = helperFunc.getThreeLineFields(fieldName, fullText, fIndex, 500, newLineindicator);
        //        console.log("COBERTURAS", ArrayString);
        if (ArrayString.length > 3)
            json.policy.franchise = helperFunc.stringToNum(ArrayString[3].trim());


        /*TELEFONE*/
        var fieldName = "telefone";
        var fIndex = fullText.search(fieldName);
        if (fIndex > -1) {
            var telText = fullText.substring(fIndex, fIndex + 100).replace("<br>", ":").replace("</&&>", ":S");
            //            var endIdx = telText.search("<br>");

            //console.log("TELEFONE", telText);
            fieldName = "telefone:";
            fIndex = telText.search(fieldName);
            json.client.phone = helperFunc.getField(fieldName, telText, fIndex, 100).replace(/[^A-Z0-9]/ig, "").replace(/\D/g, '');
            //       
        }

        /********************DADOS DO(A) SEGURADO(A)***************************/
        var fieldName = "<br></&&>segurado<br>";
        var fIndex = fullText.search(fieldName);
        //        ////console.log(fIndex);
        var clientText = fullText.substring(fIndex + fieldName.length, fIndex + fieldName.length + 5000);
        clientText = fullText.replace(/ *\([^)]*\) */g, " ");
        clientFields.forEach(function (field) {
            var n = clientText.search(field);
            //            ////console.log(clientText)
            if (n > -1) {
                switch (field) {
                    case "nome / razão social</&&>cpf / cnpj":
                        var ArrayString = helperFunc.getThreeLineFields(field, clientText, n, 400, newLineindicator);
                        //console.log("ArrayString", ArrayString)
                        if (ArrayString.length > 0)
                            json.client.name = ArrayString[0].replace(/[^A-Z]/ig, " ");
                        if (json.client.name === "") {
                            var idx = clientText.search(ArrayString[ArrayString.length - 1]);
                            var substr = clientText.substring(idx + ArrayString[ArrayString.length - 1].length, idx + 200).replace("<br>", "");
                            var tempArray = substr.split("</&&>");
                            if (tempArray.length > 0)
                                json.client.name = tempArray[0];
                            if (tempArray.length > 1)
                                json.client.id = tempArray[1].replace(/[^A-Z0-9]/ig, "").replace(/\D/g, '');
                            //console.log(tempArray)
                        }
                        if (ArrayString.length > 1) {
                            if (!json.client.id || json.client.id === "") {
                                json.client.id = ArrayString[1].replace(/[^A-Z0-9]/ig, "").replace(/\D/g, '');
                                //console.log(ArrayString)
                            }
                        }
                        //                        json.client.cpf = helperFunc.getField(field, clientText, n, 50).replace(/[^A-Z0-9]/ig, "").replace(/\D/g, '');
                        break;
                    case "endereço </&&>cep":
                        var ArrayString = helperFunc.getThreeLineFields(field, clientText, n, 400, newLineindicator);
                        //                        console.log(ArrayString)
                        if (ArrayString.length > 0) {
                            var temp = ArrayString[0].split(",");
                            if (temp.length > 0)
                                json.client.address.street = temp[0].trim();
                            if (temp.length > 1) {
                                json.client.address.number = temp[1].trim().replace(/[^A-Z0-9]/ig, "").replace(/\D/g, '');
                            }
                        }
                        if (ArrayString.length > 1)
                            json.client.address.cep = ArrayString[1].replace(/[^A-Z0-9]/ig, "").replace(/\D/g, '');
                        break;
                    case "bairro</&&>cidade</&&>uf":
                        var ArrayString = helperFunc.getThreeLineFields(field, clientText, n, 400, newLineindicator);
                        if (ArrayString.length > 0)
                            json.client.address.neigborhood = ArrayString[0].trim();
                        if (ArrayString.length > 1)
                            json.client.address.city = ArrayString[1].trim();
                        if (ArrayString.length > 2)
                            json.client.address.state = ArrayString[2].trim().replace(/[^A-Z]/ig, "");

                        break;

                    case "bairro:":
                        json.client.address.neigborhood = helperFunc.getField(field, clientText, n, 200).trim();
                        break;

                    case "email:":
                        json.client.address.cep = helperFunc.getField(field, clientText, n, 200);
                        break;
                    case "cidade:":
                        json.client.address.city = helperFunc.getField(field, clientText, n, 200).trim();
                        break;
                    case "inicío: a partir das 24h de":
                        var ArrayString = helperFunc.getThreeLineFields(field, clientText, n, 400, newLineindicator);
                        //console.log(ArrayString)
                        if (ArrayString.length > 0)
                            var d = ArrayString[0].split("/");
                        json.policy.startDateEffective = new Date(d[2] + "," + d[1] + "," + d[0]);
                        if (ArrayString.length > 1)
                            var d = ArrayString[1].split("/");
                        json.policy.endDateEffective = new Date(d[2] + "," + d[1] + "," + d[0]);
                        break;

                }
            }
        });


        /********************DADOS DO SEGURADO***************************/
        var fieldName = "</&&>dados do seguro<br>";
        var fIndex = fullText.search(fieldName);
        //        ////console.log(fIndex);
        var policyText = fullText.substring(fIndex + fieldName.length, fIndex + fieldName.length + 5000);
        policyFields.forEach(function (field) {
            var n = policyText.search(field);
            //            ////console.log(clientText)
            if (n > -1) {
                switch (field) {
                    case "apólice:":
                        json.policy.policyNumber = helperFunc.getField(field, policyText, n, 100).trim();
                        break;
                    case "classe de bônus:":
                        json.policy.bonusClass = helperFunc.getField(field, policyText, n, 100).trim();
                        break;
                }
            }
        });

        /********************DADOS DO SEGURADO***************************/
        var fieldName = "</&&>seguro<br>";
        var fIndex = fullText.search(fieldName);
        //        ////console.log(fIndex);
        var vehicleText = fullText.substring(fIndex + fieldName.length, fIndex + fieldName.length + 5000).replace(/<\/&&>00<br><\/&&>00/g, "");
        vehicleFields.forEach(function (field) {
            var n = vehicleText.search(field);
            //            ////console.log(clientText)
            if (n > -1) {
                switch (field) {
                    case "veículo<br>":
                    case "veículo</&&>":
                        var temp = helperFunc.getField(field, vehicleText, n, 300).trim();
                        //console.log(temp)
                        if (!json.policy.brand || json.policy.brand === "") {
                            json.policy.brand = temp.split(" ")[0].trim();
                            json.policy.model = temp.replace(json.policy.brand, "").trim();
                        }
                        break;
                    case "ano modelo:":
                        json.policy.modelYear = helperFunc.getField(field, vehicleText, n, 100).trim();
                        break;
                    case "ano de fabricação:":
                        json.policy.yearManufacturing = helperFunc.getField(field, vehicleText, n, 100).trim();
                        break;

                        break;
                    case "ano / modelo</&&>placa</&&>chassi":
                        var ArrayString = helperFunc.getThreeLineFields(field, vehicleText, n, 400, newLineindicator);
                        //console.log(ArrayString);
                        if (ArrayString.length > 0) {
                            var temp = ArrayString[0].split("/");
                            if (temp.length > 0)
                                json.policy.yearManufacturing = temp[0].trim();
                            if (temp.length > 1)
                                json.policy.modelYear = temp[0].trim();
                        }
                        if (ArrayString.length > 1)
                            json.policy.plate = ArrayString[1].trim();
                        if (ArrayString.length > 2)
                            json.policy.chassis = ArrayString[2].trim();

                        break;
                    case "bônus - classe</&&>nº.ci":
                        var ArrayString = helperFunc.getThreeLineFields(field, vehicleText, n, 400, newLineindicator);
                        //console.log(ArrayString);
                        if (ArrayString.length > 0 && ArrayString[0].trim() !== "") {
                            json.policy.bonusClass = ArrayString[0].trim();
                        } else if (ArrayString.length > 1 && ArrayString[1].trim() !== "") {
                            json.policy.bonusClass = ArrayString[1].trim();
                        }
                        break;



                }
            }
        });

        /********************COBERTURA***************************/
        var fieldName = "coberturas</&&>";
        var fIndex = fullText.search(fieldName);
        //        console.log(fIndex);
        var coverText = fullText.substring(fIndex + fieldName.length, fIndex + fieldName.length + 5000);
        coverFields.forEach(function (field) {
            var n = coverText.search(field);
            //            ////console.log(coverText)
            if (n > -1) {
                switch (field) {

                    case "danos materiais":
                        //                        console.log("Danos materiais", helperFunc.getField(field, coverText, n, 300))
                        json.policy.thirdPartyMaterialDamages = helperFunc.stringToNum(helperFunc.getField(field, coverText, n, 300));

                        break;
                    case "danos corporais":
                        json.policy.thirdPartyBodyDamages = helperFunc.stringToNum(helperFunc.getField(field, coverText, n, 200));
                        break;
                    case "danos morais":
                        json.policy.thirdPartyMoralDamages = helperFunc.stringToNum(helperFunc.getField(field, coverText, n, 200));
                        break;
                        //                    case "coberturas</&&>l.m.i r</&&>prêmio líquido</&&>franquia r":
                        //                        var ArrayString = helperFunc.getThreeLineFields(field, fullText, 0, 500, newLineindicator);
                        //                        console.log("COBERTURAS", ArrayString);
                        //                        if (ArrayString.length > 3)
                        //                            json.policy.franchise = helperFunc.stringToNum(ArrayString[3].trim());
                        //
                        //                        break;
                    case "prêmio total":
                        json.policy.price = helperFunc.stringToNum(helperFunc.getField(field, coverText, n, 200));
                        break;
                }
            }
        });

        /********************SERVIcOS***************************/
        var fieldName = "</&&>servicos<br>";
        var fIndex = fullText.search(fieldName);
        ////console.log(fIndex);
        var serviceText = fullText.substring(fIndex + fieldName.length, fIndex + fieldName.length + 5000);
        serviceFields.forEach(function (field) {
            var n = serviceText.search(field);
            if (n > -1) {
                switch (field) {

                    case "para brisa":
                        json.policy.windshield = helperFunc.getField(field, serviceText, n, 200);
                        break;
                    case "vigia":
                        json.policy.backShield = helperFunc.getField(field, serviceText, n, 200).replace(/[$]/g, "").replace("r", "").trim();
                        break;
                    case "lateral":
                        json.policy.windowShield = helperFunc.getField(field, serviceText, n, 200).replace(/[$]/g, "").replace("r", "").trim();
                        break;
                    case "retrovisor externo":
                        json.policy.rearview = helperFunc.getField(field, serviceText, n, 200).replace(/[$]/g, "").replace("r", "").trim();
                        break;

                }
            }
        });


        /********************DADOS DO PAGAMENTO***************************/
        var fieldName = "</&&>dados do pagamento<br>";
        var fIndex = fullText.search(fieldName);
        ////console.log(fIndex);
        var priceText = fullText.substring(fIndex + fieldName.length, fIndex + fieldName.length + 5000);
        priceFields.forEach(function (field) {
            var n = priceText.search(field);
            if (n > -1) {
                switch (field) {
                    case "prêmio líquido total juros</&&>custo de emissão</&&>iof</&&>prêmio total":
                        var ArrayString = helperFunc.getThreeLineFields(field, priceText, n, 400, newLineindicator);
                        if (ArrayString.length > 4) {
                            json.policy.price = ArrayString[4].replace(/[$]/g, "").replace("r", "").trim();
                        }
                        break;
                }
            }
        });


        console.log(json);
        helperFunc.validateJsonFields(json, function (err, data) {
            console.log("Resultado de teste", err, data);
        });
        //        done(null, json);
    }
});
//}
//})();
