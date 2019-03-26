
// Инициализация карты
function initMap(){

    // Инициализируем карту
    const myMap = new ymaps.Map("map", {
        center: [55.76, 37.64],
        zoom: 14
    });

    // Объект для хранения меток
    const placemarks = {};

    // Создаем кластеризатор
    const clusterer = new ymaps.Clusterer({
        clusterDisableClickZoom: true,
        clusterOpenBalloonOnClick: true,
        clusterBalloonContentLayout: 'cluster#balloonCarousel',
        clusterBalloonItemContentLayout: ymaps.templateLayoutFactory.createClass(getCarouselReviewHTML()),
        clusterBalloonPanelMaxMapArea: 0,
        clusterBalloonContentLayoutWidth: 300,
        clusterBalloonContentLayoutHeight: 200,
        clusterBalloonPagerSize: 5
    });

    // Добавляем кластеризатор
    myMap.geoObjects.add(clusterer);

    // Первоначальное открытие балуна по клику при отсутствии метки / отзывов по данному адресу
    myMap.events.add('click', function (e) {
        var coords = e.get('coords');
        getAddress(coords).then(address => {
            myMap.balloon.open(coords,
                `<div style="display:block">
                    ${createBalloonHeader(address)}
                    ${createBalloonBody({geodata: {coords: coords, address: address, zoomLevel: myMap.getZoom()} })}
                </div>`,
                {
                    closeButton: true
                }
            );
        });

    });

    function getAddress(coords) {
        // Получаем адрес по координатам
        return ymaps.geocode(coords).then(res => res.geoObjects.get(0).getAddressLine());
    }

    // Генерация разметки балуна для карусели, с использованием данных метки. Отметим атрибут
    // id узла DOM, куда мы помещаем уникальный идентификатор метки
    function getCarouselReviewHTML(){
        return `
        <h2 class=ballon_header>
            <a 
                id="{{properties.placemarkId}}"
                onclick="return carouselClickHandler(event);">{{ properties.carouselLayout.header|raw }}
            </a>  
        </h2>
        <div class=ballon_body>{{ properties.carouselLayout.body|raw }}</div>`;
    }

    // Создание объекта метки.
    function createPlacemark(coords, address, zoomLevel) {
        const id = createUUID();
        const placemark = new ymaps.Placemark(coords, {
            iconCaption: 'поиск...',
            balloonContentHeader: createBalloonHeader(address),
            balloonContentBody: createBalloonBody({id:id}),
            balloonContentFooter: '',
            hintContent: '',
            // Свойства ниже - нестандартные, добавленные нами
            carouselLayout: {
                header: address,
                body: null
            },
            placemarkId: id,
            currentZoomLevel: zoomLevel,
            reviews: []
        }, {
            preset: 'islands#violetDotIconWithCaption',
            draggable: false,
            minHeight: 700
        });
        return placemark;
    }

    // Обработчик события клика по телу балуна индивидуальной метки
    function reviewBodyClickHandler(event){
        event.stopPropagation();
        if(event.target.nodeName === 'BUTTON') { // Проверка что клик был именно по кнопке 'Добавить'
            const elem = event.currentTarget; // DOM - элемент balloon - body, на котором ловим клик
            // Находим DOM - элемент формы отзыва, извлекаем объект review
            const review = extractReview(elem.querySelector('form'));
            if (review) {
                let id = event.currentTarget.id;
                let placemark;
                if(id){ // Наличие id означает, что метка (а значит и отзывы) на данный адрес уже существуют
                    placemark = placemarks[id]
                } else {
                    // Вытаскиваем информацию о геолокации из DOM - элемента тела балуна
                    let geodata = decodeObject(elem.dataset.geodata);
                    // Создаем метку с уникальным id
                    placemark = createPlacemark(geodata.coords, geodata.address, geodata.zoomLevel);
                    // Получаем id из свойств метки
                    id = placemark.properties.get("placemarkId");
                    // Сохраняем метку в глобальный объект с метками
                    placemarks[id] = placemark;
                    // Добавляем метку в кластеризатор
                    clusterer.add(placemark);
                    // Устанавливем атрибут id DOM - узла balloon body (потребуется для добавления
                    // новых отзывов без закрытия этого балуна)
                    event.currentTarget.id = id;
                }
                // Добавляем новый отзыв в массив отзывов для данной метки
                const allReviews = placemark.properties.get('reviews');
                allReviews.push(review);
                // Создаем HTML - разметку для всех отзывов двнной метки, включая новый
                const reviewsHTML = getAllReviewsHTML(allReviews);
                // Обновляем нами определенное свойство метки 'carouselLayout', по которому строится
                // HTML - разметка для содержания данной метки в режиме кластера / карусели
                placemark.properties.set('carouselLayout', {
                    header: placemark.properties.get('carouselLayout').header,
                    body: reviewsHTML
                });
                // Обновляем свойство 'balloonContentBody' данной метки
                placemark.properties.set('balloonContentBody',
                    createBalloonBody({id:id, reviews: allReviews})
                );
                // Обнавляем текушую разметку открытого балуна
                const reviewContainer = elem.querySelector('.reviewListContaner');
                reviewContainer.innerHTML = reviewsHTML;
                // Очищаем данные формы ввода отзыва
                clearForm(event.currentTarget.querySelector('form'));
            }
        }
    }

    // Обработчик события клика ссылке из карусели на индивидуальную метку
    function carouselClickHandler(event){
        // Вытаскиваем id соответствующей индивидуальной метки
        const id = event.currentTarget.id;
        // Закрываем балун метки кластера
        clusterer.balloon.close();
        // Приходится вручную менять масштаб карты, так как иначе соответствующая
        // индивидуальная метка исчезает доступных в данный момент меток в
        // кластеризаторе, и ее балун не открывается
        let originalZoom = placemarks[id].properties.get('currentZoomLevel');
        let finalZoom = Math.min(originalZoom + 2, 17);
        myMap.setZoom(finalZoom)
            .then(
                // Центрируем карты после перемасштабирования
                () => myMap.panTo(placemarks[id].geometry.getCoordinates())
            )
            .then(
                // Открываем балун индивидуальной метки
                () => placemarks[id].balloon.open()
            );
    }

    return [reviewBodyClickHandler, carouselClickHandler];
}