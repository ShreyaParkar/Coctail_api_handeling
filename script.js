document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const mealList = document.getElementById('meal');
    const mealDetailsContent = document.querySelector('.meal-details-content');
    const recipeCloseBtn = document.getElementById('recipe-close-btn');
    const isFavoritesPage = window.location.pathname.includes('favourite.html'); // Check if it's the favorites page

    let debounceTimer;

    // Debounce function to limit API calls while typing
    function debounce(func, delay) {
        return (...args) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func(...args), delay);
        };
    }

    // Fetch and display meal list based on search query
    function getMealList(query) {
        if (!query) {
            mealList.innerHTML = `<div class="notFound">Please enter a search term!</div>`;
            return;
        }

        // Show a loading message while fetching data
        mealList.innerHTML = `<div class="loading">Loading...</div>`;

        fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?f=${query}`)
            .then(response => response.json())
            .then(data => renderMealList(data))
            .catch(error => {
                console.error("Error fetching meals:", error);
                mealList.innerHTML = `<div class="notFound">An error occurred. Please try again later.</div>`;
            });
    }

    function renderMealList(data) {
        let html = "";
        if (data && data.drinks) {
            data.drinks.forEach(drink => {
                html += `
                <div class="meal-item" data-id="${drink.idDrink}">
                    <div class="meal-img">
                        <img src="${drink.strDrinkThumb}" alt="${drink.strDrink}">
                    </div>
                    <div class="meal-name">
                        <h3>${drink.strDrink}</h3>
                        <a href="#" class="recipe-btn">Get Recipe</a>
                    </div>
                </div>
                `;
            });
            mealList.classList.remove('notFound');
        } else {
            html = "Sorry, we didn't find any cocktails!";
            mealList.classList.add('notFound');
        }
        mealList.innerHTML = html;
    }

    // Fetch and display recipe details
    function getMealRecipe(e) {
        e.preventDefault();
        if (e.target.classList.contains('recipe-btn')) {
            let mealItem = e.target.closest('.meal-item');
            fetch(`https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${mealItem.dataset.id}`)
                .then(response => response.json())
                .then(data => mealRecipeModal(data.drinks[0]))
                .catch(error => console.error("Error fetching recipe:", error));
        }
    }

    function mealRecipeModal(drink) {
        const ingredients = Array.from({ length: 15 }, (_, i) => ({
            ingredient: drink[`strIngredient${i + 1}`],
            measure: drink[`strMeasure${i + 1}`],
        })).filter(item => item.ingredient);

        const ingredientsList = ingredients
            .map(item => `<li>${item.measure || ''} ${item.ingredient}</li>`)
            .join("");

        let html = `
            <h2 class="recipe-title">${drink.strDrink}</h2>
            <p class="recipe-category">${drink.strCategory}</p>
            <div class="recipe-instruct">
                <h3>Instructions</h3>
                <p>${drink.strInstructions}</p>
            </div>
            <div class="recipe-meal-img">
                <img src="${drink.strDrinkThumb}" alt="${drink.strDrink}">
            </div>
            <div class="recipe-ingredients">
                <h3>Ingredients</h3>
                <ul>${ingredientsList}</ul>
            </div>
        `;

        if (!isFavoritesPage) {
            html += `
            <div class="recipe-link">
                <a href="#" id="save-btn" data-id="${drink.idDrink}">Save</a>
            </div>`;
        }

        mealDetailsContent.innerHTML = html;
        mealDetailsContent.parentElement.classList.add('showRecipe');

        if (!isFavoritesPage) {
            const saveBtn = document.getElementById('save-btn');
            if (saveBtn) {
                saveBtn.addEventListener('click', () => saveToFavorites(drink));
            }
        }
    }

    // Save cocktail to favorites
    function saveToFavorites(drink) {
        let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        if (!favorites.some(fav => fav.idDrink === drink.idDrink)) {
            favorites.push(drink);
            localStorage.setItem('favorites', JSON.stringify(favorites));
            alert('Cocktail added to favorites!');
        } else {
            alert('Cocktail is already in favorites!');
        }
    }

    // Display favorites on favorites page
    function displayFavorites() {
        const favoriteMeals = document.getElementById('favorite-meals');
        if (!favoriteMeals) return; // Exit if not on favorites page

        let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        let html = "";
        if (favorites.length > 0) {
            favorites.forEach(drink => {
                html += `
                <div class="meal-item" data-id="${drink.idDrink}">
                    <div class="meal-img">
                        <img src="${drink.strDrinkThumb}" alt="Cocktail">
                        <button class="remove-btn" data-id="${drink.idDrink}">&times;</button>
                    </div>
                    <div class="meal-name">
                        <h3>${drink.strDrink}</h3>
                        <a href="#" class="recipe-btn">Get Recipe</a>    
                    </div>
                </div>
                `;
            });
            favoriteMeals.innerHTML = html;
            favoriteMeals.addEventListener('click', getMealRecipe);
            favoriteMeals.addEventListener('click', removeFromFavorites);
        } else {
            favoriteMeals.innerHTML = `
            <div class="notFound">No favorite cocktails found!</div>
        `;
        }
    }

    // Remove cocktail from favorites
    function removeFromFavorites(e) {
        if (e.target.classList.contains('remove-btn')) {
            const drinkId = e.target.dataset.id;
            let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
            favorites = favorites.filter(drink => drink.idDrink !== drinkId);
            localStorage.setItem('favorites', JSON.stringify(favorites));
            displayFavorites(); // Refresh the list
        }
    }

    // Attach event listeners
    if (!isFavoritesPage) {
        searchInput.addEventListener('input', debounce(() => {
            getMealList(searchInput.value.trim());
        }, 300)); // Adjust delay as needed
    }

    if (mealList) mealList.addEventListener('click', getMealRecipe);
    if (recipeCloseBtn) recipeCloseBtn.addEventListener('click', () => {
        mealDetailsContent.parentElement.classList.remove('showRecipe');
    });

    if (isFavoritesPage) {
        displayFavorites();
    }
});
