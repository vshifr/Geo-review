// Создание уникального идентификатора метки
let createUUID = (function(){
    var ctr = 0;
    return function(){
        return 'placemark_'+ ctr++;
    };
})();

function encodeObject(geodata){
    return encodeURIComponent(JSON.stringify(geodata));
}

function decodeObject(encoded){
    return JSON.parse(decodeURIComponent(encoded));
}

// Очистка значений формы ввода
function clearForm(formNode){
    Array
        .from(formNode.querySelectorAll('input, textarea'))
        .forEach(node => {node.value = "";});
}