// Генерация HTML - разметки для одного отзыва
function getReviewHTML(review) {
    return `
        <div class="review">
          <div>
              <div class="reviewer"> ${review.reviewer}</div>
              <div class="reviwed-place"> ${review.venue + '  ' + review.date}</div>
          </div>
          <div class="review-text"> ${review.text}</div>
        </div>`;
}

// Генерация HTML - разметки для массива отзывов
function getAllReviewsHTML(reviews){
    let result = "";
    reviews.forEach(r => {result += getReviewHTML(r) + "\n"});
    return result;
}

// Генерация HTML - разметки формы ввода нового отзыва
function createReviewForm(){
    return `
        <div class="review-form">
            <div class="review-form-header">
              ВАШ ОТЗЫВ
            </div>
            <div style="display:block">
              <form style="display:inline-block">
                
                <input name="reviewer" class="review-input" type="text" placeholder="Ваше имя"><br>
                
                <input name="venue" class="review-input" type="text" placeholder="Укажите место">
    
                <textarea 
                  name="text"
                  class="review-input" 
                  rows="4" 
                  cols="50" 
                  placeholder="Поделитесь впечатлениями"></textarea>
              </form>
              <div class="button-container">
                <button class="submit-btn">
                    Добавить
                </button>
              </div>
            </div>  
        </div>`;
}

// Извлечение объекта отзыва из DOM - узла формы ввода
function extractReview(formNode){
    const review = {};
    for(const [prop, val] of new FormData(formNode).entries()){
        const value = val.trim();
        if(!value){
            return null;
        }
        review[prop] = value;
    }
    review.date = new Date().toLocaleDateString();
    return review;
}
