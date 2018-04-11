module.exports = {
  validateJsonFields: function (myobj, done) {
    report = {
        client: [],
        policy: []
    };
    for (var idx = 0; idx < requiredFieldsResidencial.length; idx++) {
        var result = processFields(myobj, requiredFieldsResidencial[idx]);
        if (result.length)
            report[requiredFieldsResidencial[idx].name].push(result);
    }
    return done(null, report);
  },
}

var requiredFieldsResidencial = [{
  name: "client",
  keys: [{
    field: "name",
    name: "nome"
  }, {
    field: "id",
    name: "cpf/cnpj"
  }, {
    field: "phone",
    name: "telefone"
  }]
}, {
  name: "client",
  secondField: "address",
  keys: [
  {
    field: "street",
    name: "endereço"
  }, {
    field: "number",
    name: "número"
  }, {
    field: "neighborhood",
    name: "bairro"
  }, {
    field: "city",
    name: "cidade"
  }, {
    field: "state",
    name: "estado"
  }, {
    field: "postalcode",
    name: "cep"
  }]
}, {
  name: "policy",
  keys: [{
      field: "insuranceId",
      name: "cnpj da seguradora"
    },
    {
      field: "typeOfpolicy",
      name: "tipo de apólice"
    },
    {
      field: "policyNumber",
      name: "número de apólice"
    },
    {
      field: "startDateEffective",
      name: "data de início da vigência"
    },
    {
      field: "endDateEffective",
      name: "data de fim da vigência"
    },
    {
      field: "price",
      name: "Preço do Seguro"
    },
    {
      field: "riskAddress",
      name: "Endereço do Risco"
    },
    {
      field: "riskStreetNumber",
      name: "Numero Endereço do Risco"
    },
    {
      field: "riskNeighborhood",
      name: "Bairro Endereço do Risco"
    },
    {
      field: "riskCity",
      name: "Cidde Endereço do Risco"
    },
    {
      field: "riskState",
      name: "Estado Endereço do Risco"
    },
    {
      field: "riskPostalCode",
      name: "CEP Endereço do Risco"
    },
    {
      field: "basicCoverage",
      name: "Cobertura Basica"
    }
  ]
}];

function processFields(myobj, field) {

  var resultArray = [];
  for (var i = 0; i < field.keys.length; i++) {
      if (field.secondField) {
          if (!myobj[field.name].hasOwnProperty([field.secondField]) || !myobj[field.name][field.secondField][field.keys[i].field] || myobj[field.name][field.secondField][field.keys[i].field] === "" || myobj[field.name][field.secondField][field.keys[i].field] === null) {
              resultArray.push("O campo " + " " + field.keys[i].name + " " + "não existe ou está vazio");
          }
      } else {
          if (!myobj[field.name].hasOwnProperty([field.keys[i].field]) || !myobj[field.name][field.keys[i].field] || myobj[field.name][field.keys[i].field] === "" || myobj[field.name][field.keys[i].field] === null) {
              resultArray.push("O campo " + " " + field.keys[i].name + " " + "não existe ou está vazio");
          }
      }
  }
  return resultArray;
}