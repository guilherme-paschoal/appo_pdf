"use strict"

const fs = require('fs');

let dirtyArray = [];
let extractionErrors = [];

// Classe que contem o resultado da chamada de um dos metodos de leitura cujo nome começam com "read"
class ExtractionResult {

  constructor(values, hasValues) {
    this.values = values;
    this.hasValues = hasValues;
  }

  // O "values" dessa classe é sempre um array. Pega o item do Array de acordo com o indice.
  getValue(index) {
    if(this.hasValues){
      if(this.values.length == 0) { throw "Values needs to be  an array"; }
      if(this.values[index]) {
        return this.values[index].trim();
      }
    }
    return "";
  }

  // Sobrecarga do metodo getValue. Caso seja forncedido um "textToRemove", essa string será removida da string retornada.
  getValue(index, textToRemove) {
    if(this.hasValues){
      if(this.values.length == 0) { throw "Values needs to be  an array"; }
      if(this.values[index]) {
        return this.values[index].replace(textToRemove, "").trim();
      }
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
  getDirtyArray: function() {
    return dirtyArray;
  },

  getExtractionErrors: function() {
    return extractionErrors;
  },

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
    return this.cleanLinesUp(require('fs').readFileSync('temp_read.tmp', 'utf-8').split('\n'));
  },

   // Substitui qualquer "2 ou mais espaços" por "||"
   cleanLinesUp: function(arr) {
    let newArr = [];
    for(let x=0; x<arr.length; x++) {
      if(arr[x].trim().length > 0) {
        dirtyArray.push(arr[x].trim());
        newArr.push(arr[x].trim().replace(/\s\s+/g, '||'));
      }
    }
    
    return newArr;
  },

  // Procura dentro do Array de linhas de texto do PDF, qual o indice da linha que contem o texto passado
  getLineIndexWithText: function(arr, text) {
    let i = -1;

    for(let x=0; x<arr.length; x++) {
      if(arr[x].indexOf(text) > -1) {
        i = x;
        break;
      }
    }

    if(i == -1) {
      extractionErrors.push("Não foi possível encontrar a string: " + text);
    }
    return i;
  },

  // Procura dentro do Array de linhas de texto do PDF, qual o indice da linha que contem o texto passado na posicao pos
  getLineIndexWithTextAt: function(arr, text, pos) {
    let i = -1;

    for(let x=0; x<arr.length; x++) {
      if(arr[x].indexOf(text) == pos) {
        i = x;
        break;
      }
    }

    if(i == -1) {
      extractionErrors.push("Não foi possível encontrar a string: " + text);
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
    if(i > -1) {
      return new ExtractionResult(arr[i].trim().split('||'), true);
    } else {
      return new ExtractionResult(null, false);
    }
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

  getWordAt(str, pos) {

    // Search for the word's beginning and end.
    var left = str.slice(0, pos + 1).search(/\S+$/),
        right = str.slice(pos).search(/\s\s/); // the end of a word in our case is delimited by 2 space characters

    // The last word in the string is a special case.
    if (right < 0) {
        return str.slice(left);
    }

    // Return the word, using the located bounds to extract it from the string.
    return str.slice(left, right + pos);
  }

}; 