// Функция для управления избранным
function toggleFavorite(dressId) {
  let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  const icon = document.querySelector(`[data-id="${dressId}"] .favorite-icon`);

  if (favorites.includes(dressId)) {
    // Удаляем из избранного
    favorites = favorites.filter(id => id !== dressId);
    icon.classList.remove('active');
  } else {
    // Добавляем в избранное
    favorites.push(dressId);
    icon.classList.add('active');
  }

  localStorage.setItem('favorites', JSON.stringify(favorites));
}

// Функция для применения фильтров
function applyFilters() {
  const selectedSizes = Array.from(document.querySelectorAll('.filter-size:checked')).map(cb => cb.value.trim());
  const selectedGenders = Array.from(document.querySelectorAll('.filter-gender:checked')).map(cb => cb.value.trim());

  const dressCards = document.querySelectorAll('.dress-card');

  dressCards.forEach(card => {
    const sizes = card.dataset.size.split(',').map(s => s.trim());
    const genders = card.dataset.gender.split(',').map(g => g.trim());

    // Проверка соответствия выбранным фильтрам
    const sizeMatch = selectedSizes.length === 0 || selectedSizes.some(size => sizes.includes(size));
    const genderMatch = selectedGenders.length === 0 || selectedGenders.some(gender => genders.includes(gender));

    if (sizeMatch && genderMatch) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}

// Функция для обновления отображения избранного
let showFavorites = false;

function updateFavoritesView() {
  const dressCards = document.querySelectorAll('.dress-card');
  const favorites = JSON.parse(localStorage.getItem('favorites')) || [];

  dressCards.forEach(card => {
    const dressId = card.dataset.id;
    if (showFavorites) {
      if (favorites.includes(dressId)) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    } else {
      card.style.display = 'flex';
    }
  });

  // Применяем фильтры после обновления отображения
  if (!showFavorites) {
    applyFilters();
  }
}

// Функция для открытия модального окна изображения с навигацией
function openImageModal(images, currentIndex) {
  const modal = document.getElementById('image-modal');
  const closeButton = modal.querySelector('.close-button');
  const swiperWrapper = modal.querySelector('.swiper-wrapper');

  // Очищаем предыдущие слайды
  swiperWrapper.innerHTML = '';

  // Добавляем изображения в слайды
  images.forEach((imageUrl) => {
    const swiperSlide = document.createElement('div');
    swiperSlide.classList.add('swiper-slide');

    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = '';
    img.loading = 'lazy';

    swiperSlide.appendChild(img);
    swiperWrapper.appendChild(swiperSlide);
  });

  // Показываем модальное окно
  modal.style.display = 'flex';

  // Инициализируем Swiper в модальном окне
  if (window.modalSwiper) {
    // Если Swiper уже инициализирован, обновляем его
    window.modalSwiper.update();
    window.modalSwiper.slideToLoop(currentIndex, 0);
  } else {
    window.modalSwiper = new Swiper('.modal-swiper', {
      initialSlide: currentIndex,
      navigation: {
        nextEl: '.image-modal .swiper-button-next',
        prevEl: '.image-modal .swiper-button-prev',
      },
      loop: true,
    });
  }

  // Закрытие модального окна при клике на кнопку
  closeButton.onclick = function(event) {
    event.stopPropagation(); // Предотвращаем всплытие события
    modal.style.display = 'none';
    window.modalSwiper.destroy();
    window.modalSwiper = null;
  };

  // Закрытие модального окна при клике вне контента
  modal.onclick = function(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
      window.modalSwiper.destroy();
      window.modalSwiper = null;
    }
  };
}

// Функция для создания карточки платья
function createDressCard(dress) {
  const card = document.createElement('div');
  card.classList.add('dress-card');
  card.setAttribute('data-id', dress.id);
  card.setAttribute('data-size', dress.sizes);
  card.setAttribute('data-gender', dress.gender);

  // Иконка избранного
  const favoriteIcon = document.createElement('div');
  favoriteIcon.classList.add('favorite-icon');
  favoriteIcon.innerHTML = `<span>&#9825;</span>`;
  favoriteIcon.addEventListener('click', (event) => {
    event.stopPropagation(); // Предотвращаем открытие модального окна при клике на иконку
    toggleFavorite(dress.id);
  });
  card.appendChild(favoriteIcon);

  // Изображение платья
  const image = document.createElement('img');
  image.src = dress.images[0]; // Первое изображение
  image.alt = dress.description;
  image.loading = 'lazy'; // Lazy Loading

  // Добавляем обработчик для увеличения изображения при клике
  image.addEventListener('click', () => openImageModal(dress.images, 0));

  card.appendChild(image);

  // Название платья
  const dressName = document.createElement('h3');
  dressName.classList.add('dress-name');
  dressName.textContent = dress.name;
  card.appendChild(dressName);

  // Описание платья
  const description = document.createElement('div');
  description.classList.add('dress-description');
  const descPara = document.createElement('p');
  descPara.textContent = dress.description;
  description.appendChild(descPara);
  card.appendChild(description);

  // Теги платья
  const tags = document.createElement('div');
  tags.classList.add('dress-tags');

  const sizeSpan = document.createElement('span');
  sizeSpan.textContent = `Размеры: ${dress.sizes}`;
  tags.appendChild(sizeSpan);

  const genderSpan = document.createElement('span');
  genderSpan.textContent = `Назначение: ${dress.gender}`;
  tags.appendChild(genderSpan);

  card.appendChild(tags);

  return card;
}

// Функция для загрузки CSV и рендеринга карточек
function loadDresses() {
  Papa.parse('dresses.csv', {
    download: true,
    header: true,
    dynamicTyping: true,
    complete: function(results) {
      const dresses = results.data.map(dress => ({
        id: dress.id,
        name: dress.name,
        description: dress.description,
        sizes: dress.sizes.replace(/\s+/g, ''), // Удаляем пробелы
        gender: dress.gender.replace(/\s+/g, ''), // Удаляем пробелы
        images: [dress.image1, dress.image2, dress.image3, dress.image4].filter(url => url) // Фильтруем пустые URL
      }));

      const dressGrid = document.getElementById('dress-grid');

      dresses.forEach(dress => {
        const card = createDressCard(dress);
        dressGrid.appendChild(card);
      });

      // Инициализация состояния избранного
      let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
      favorites.forEach(dressId => {
        const icon = document.querySelector(`[data-id="${dressId}"] .favorite-icon`);
        if (icon) {
          icon.classList.add('active');
        }
      });

      // Применяем фильтры при загрузке
      applyFilters();
    },
    error: function(error) {
      console.error('Ошибка при загрузке CSV:', error);
    }
  });
}

// Обработчики событий для фильтров и избранного
document.addEventListener('DOMContentLoaded', () => {
  loadDresses();

  const filterInputs = document.querySelectorAll('.filters input[type="checkbox"]');
  filterInputs.forEach(input => {
    input.addEventListener('change', applyFilters);
  });

  // Кнопка сброса фильтров
  document.getElementById('reset-filters').addEventListener('click', () => {
    filterInputs.forEach(input => input.checked = false);
    applyFilters();
  });

  // Обработчик кнопки избранного
  document.getElementById('toggle-favorites').addEventListener('click', () => {
    showFavorites = !showFavorites;
    updateFavoritesView();
    document.getElementById('toggle-favorites').textContent = showFavorites ? 'Показать все платья' : 'Показать избранное';
  });
});