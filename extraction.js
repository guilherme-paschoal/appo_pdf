"use strict"

const fs = require('fs');

// Classe que contem o resultado da chamada de um dos metodos de leitura cujo nome começam com "read"
class ExtractionResult {

  constructor(values) {
    this.values = values;
  }

  // O "values" dessa classe é sempre um array. Pega o item do Array de acordo com o indice.
  getValue(index) {
    if(this.values.length == 0) { throw "Values needs to be  an array"; }
    if(this.values[index]) {
      return this.values[index].trim();
    }
    return "";
  }

  // Sobrecarga do metodo getValue. Caso seja forncedido um "textToRemove", essa string será removida da string retornada.
  getValue(index, textToRemove) {
    if(this.values.length == 0) { throw "Values needs to be  an array"; }
    if(this.values[index]) {
      return this.values[index].replace(textToRemove, "").trim();
    }
    return "";
  }

  getCleanValue(index) {
    return this.getValue(index).replace(/[^A-Z0-9]/ig, "").replace(/\D/g, "");
  }

  getCleanValue(index, textToRemove) {
    return this.getValue(index, textToRemove).replace(/[^A-Z0-9]/ig, "").replace(/\D/g, "");
  }
}

module.exports = {

  // Cria arquivo temporario que ira conter o PDF em forma de texto
  generateFileFromString: function(data) {
    // Garante  que o arquvio não existe antes dele ser criado.
    this.deleteTempFile();
    fs.appendFileSync('temp_read.tmp', data);
  },

  // Exclui o arquivo temporario 
  deleteTempFile: function() {
    if(fs.existsSync('temp_read.tmp')){
      fs.unlinkSync('temp_read.tmp');
    }
  },

  // Le o arquivo gerando um array com todas as linhas do arquivo PDF
  generateArrayOfTextLines: function() {
    return require('fs').readFileSync('temp_read.tmp', 'utf-8').split('\n');
  },

  // Substitui qualquer "2 ou mais espaços" por "||"
  cleanLinesUp: function(arr) {
    for(let x=0; x<arr.length; x++) {
      arr[x] = arr[x].replace(/\s\s+/g, '||');
    }
    return arr;
  },

  // Procura dentro do Array de linhas de texto do PDF, qual o indice da linha que contem o texto passado
  getLineIndexWithText: function(arr, text) {
    let i = -1;
    let quit = false;

    for(let x=0; x<arr.length; x++) {
      if(arr[x].indexOf(text) > -1) {
        i = x;
        break;
      }
    }

    if(i == -1) {
      throw "Não foi possível encontrar a string: " + text
    }
    return i;
  },

  // Retorna um Array de linhas de texto entre as linhas que contem os valores de "Start" e "End". Isso é importante para delimitar a pesquisa no texto
  // melhorando o desempenho e garantindo a precisão na pesquisa do texto.
  getArrayOfTextLinesInSection(arr, start, end) {
    let startIndex = this.getLineIndexWithText(arr, start);
    let endIndex = this.getLineIndexWithText(arr, end);
    let items = [];
    for(let x=startIndex+1;x<endIndex;x++) {
      items.push(arr[x]);
    }
    return items;
  },

  // Retorna ExtractionResult de campos cuja linha corresponde ao indice passado, dentro do array passado
  getDataArrayByLineIndex: function(arr, i) {
    return new ExtractionResult(arr[i].trim().split('||'));
  },

  // Pega os valores da proxima linha (quando os campos tem o titulo em cima e o valor em baixo)
  readNextLineData: function(arr, text) {
    let ind = this.getLineIndexWithText(arr, text);
    return this.getDataArrayByLineIndex(arr, ind + 1);
  },

  // Pega os dados de um linha que contem o texto passado, dentro do array passado.
  readLineData: function(arr, text) {
    let ind = this.getLineIndexWithText(arr, text);
    return this.getDataArrayByLineIndex(arr, ind);
  },
};