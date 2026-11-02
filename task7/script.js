/**
 * MODEL
 * Отвечает за данные приложения, работу с API и хранение состояния.
 */
class PostsModel {
    constructor() {
        this.posts = [];        // Все загруженные посты
        this.page = 1;          // Текущая страница пагинации API
        this.limit = 10;        // Количество постов за 1 запрос
        this.totalPosts = 100;  // Общее количество постов на сервере API
        this.hasMore = true;    // Флаг наличия следующих постов
        this.isFetching = false;// Защита от дублирующих запросов
    }

    // Асинхронный метод запроса данных с обработкой ошибок
    async fetchPosts() {
        if (this.isFetching || !this.hasMore) return;
        
        this.isFetching = true;
        try {
            const url = `https://jsonplaceholder.typicode.com/posts?_page=${this.page}&_limit=${this.limit}`;
            const response = await fetch(url);
            
            // Если сервер ответил ошибкой (404, 500 и т.д.)
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status} ${response.statusText}`);
            }
            
            const newPosts = await response.json();
            
            if (newPosts.length === 0) {
                this.hasMore = false;
            } else {
                this.posts = [...this.posts, ...newPosts]; // Сохраняем в общий массив
                this.page += 1;
                
                // Проверяем, достигли ли мы лимита API
                if (this.posts.length >= this.totalPosts) {
                    this.hasMore = false;
                }
            }
        } catch (error) {
            // Пробрасываем ошибку контроллеру, обязательно сбросив флаг загрузки
            this.isFetching = false;
            throw error;
        } 
        
        this.isFetching = false;
    }

    // Фильтрация данных на стороне клиента
    getFilteredPosts(searchQuery) {
        if (!searchQuery.trim()) {
            return this.posts;
        }
        const query = searchQuery.toLowerCase();
        return this.posts.filter(post => 
            post.title.toLowerCase().includes(query)
        );
    }
}

/**
 * VIEW
 * Отвечает исключительно за обновление DOM-элементов.
 */
class PostsView {
    constructor() {
        this.container = document.getElementById('post-container');
        this.searchInput = document.getElementById('search-input');
        this.loader = document.getElementById('loader');
        this.errorMessage = document.getElementById('error-message');
        this.endMessage = document.getElementById('end-message');
        this.scrollObserver = document.getElementById('scroll-observer');
    }

    // Отрисовка массива карточек постов
    renderPosts(posts) {
        // Очищаем контейнер перед рендером
        this.container.innerHTML = ''; 
        
        // Используем DocumentFragment для оптимизации вставки в DOM
        const fragment = document.createDocumentFragment();
        
        posts.forEach(post => {
            const card = document.createElement('div');
            card.className = 'post-card';
            card.innerHTML = `
                <h3>${post.title}</h3>
                <p>${post.body}</p>
                <small>ID Автора: ${post.userId} | Пост №${post.id}</small>
            `;
            fragment.appendChild(card);
        });
        
        this.container.appendChild(fragment);
    }

    showLoader(show) {
        this.loader.classList.toggle('hidden', !show);
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.classList.remove('hidden');
    }

    hideError() {
        this.errorMessage.classList.add('hidden');
    }

    showEndMessage(show) {
        this.endMessage.classList.toggle('hidden', !show);
        if (show) {
            this.scrollObserver.classList.add('hidden'); // Прячем триггер
        }
    }

    // Метод для привязки события ввода текста
    bindSearchEvent(handler) {
        this.searchInput.addEventListener('input', handler);
    }
}

/**
 * CONTROLLER
 * Связывает Model и View, отвечает за бизнес-логику (IntersectionObserver, Debounce).
 */
class PostsController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.debounceTimer = null;

        // Привязываем контекст `this`
        this.handleSearch = this.handleSearch.bind(this);
        this.loadMorePosts = this.loadMorePosts.bind(this);

        // Инициализация событий
        this.view.bindSearchEvent(this.handleSearch);
        this.initIntersectionObserver();
    }

    // Настройка бесконечного скролла через IntersectionObserver
    initIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1 // Срабатывает, когда 10% триггера видно на экране
        };

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !this.model.isFetching && this.model.hasMore) {
                this.loadMorePosts();
            }
        }, options);

        observer.observe(this.view.scrollObserver);
    }

    // Загрузка следующей порции данных
    async loadMorePosts() {
        this.view.hideError();
        this.view.showLoader(true);

        try {
            await this.model.fetchPosts();
            this.updateDisplay(); // Обновляем UI после загрузки
            
            if (!this.model.hasMore) {
                this.view.showEndMessage(true);
            }
        } catch (error) {
            this.view.showError("Не удалось загрузить данные. " + error.message);
        } finally {
            this.view.showLoader(false);
        }
    }

    // Обработчик поиска с реализацией Debounce (~300мс)
    handleSearch(event) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.updateDisplay(event.target.value);
        }, 300);
    }

    // Обновление интерфейса с учетом текущего поискового запроса
    updateDisplay(query = this.view.searchInput.value) {
        const filteredPosts = this.model.getFilteredPosts(query);
        this.view.renderPosts(filteredPosts);
    }
}

// Запуск приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    const app = new PostsController(new PostsModel(), new PostsView());
});