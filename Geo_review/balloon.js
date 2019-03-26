// Генерация HTML - разметки для заголовка балуна индивидуальной метки
function createBalloonHeader(address){
    return `
        <div class="header fixed-width">
            <div class="header-text">
                ${address}
            </div>
        </div>`;
}

// Генерация HTML - разметки для тела балуна индивидуальной метки
function createBalloonBody(options){
    // Сохраняем геоданные клика по карте в data - атрибуте, если они были переданы (они передаются
    // только для первого клика по карте, когда метки / отзыва еще нет). Эти данные будут
    // использоваться для создания объекта метки
    let geodataString = options.geodata? `data-geodata = "${encodeObject(options.geodata)}"`:"";
    // Синхронизация id - атрибута DOM - узла с уникальным идентификатором метки (если он есть,
    // то есть если метка уже существует)
    let idString = options.id ? `id = "${options.id}"` : "";
    // HTML - разметка для отзывов, если они есть
    let reviewsHTML = options.reviews
        ? getAllReviewsHTML(options.reviews)
        : `<div style="text-align: center">Пока отзывов нет</div>`;
    return `
        <div 
            class="fixed-width reviewBodyContainer" 
            onclick="return reviewBodyClickHandler(event);"
            ${idString} ${geodataString}
        >
            <div class="reviewListContaner"> ${reviewsHTML} </div>
       
            <hr class="thin">
        
            ${createReviewForm()}
        </div>
        `;
}
