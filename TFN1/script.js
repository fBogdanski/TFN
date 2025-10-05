"use strict";

let currentPage = 0;
const pageSize = 20;
const cache = {};

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

let searchInput = document.getElementById('searchInput');
let searchBtn = document.getElementById('searchBtn');

let progressBar = document.getElementById('progress-bar');

searchBtn.addEventListener("click", () => {
    getPokemon(searchInput.value.toLowerCase());
});

async function fetchPokemon(id) {
    if (cache[id]) return cache[id];

    const url = `https://pokeapi.co/api/v2/pokemon/${id}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Response status: ${response.status}`);
    const data = await response.json();

    cache[id] = data;
    return data;
}

async function displayPokemon(pokemon) {
    const container = document.querySelector('.pokemon-card.detailed');
    container.innerHTML = `
        <h3>${pokemon.name} (#${pokemon.id})</h3>
        <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
        <div class="info">
            <p><strong>Type:</strong> ${pokemon.types.map(t => t.type.name).join(', ')}</p>
            <p><strong>Abilities:</strong> ${pokemon.abilities.map(a => a.ability.name).join(', ')}</p>
            <p><strong>Height:</strong> ${pokemon.height}</p>
            <p><strong>Weight:</strong> ${pokemon.weight}</p>
            <p><strong>Base Stats:</strong></p>
            <ul>
                ${pokemon.stats.map(stat => `<li>${stat.stat.name}: ${stat.base_stat}</li>`).join('')}
            </ul>
        </div>
    `;
}

async function getPokemon(nameOrId) {
    try {
        progressBar.style.display = "block";
        const pokemon = await fetchPokemon(nameOrId);
        displayPokemon(pokemon);
    } catch (error) {
        console.error(error.message);
        const container = document.querySelector('.pokemon-card.detailed');
        container.innerHTML = `<p>Pokemon not found!</p>`;
    } finally {
        progressBar.style.display = "none";
    }
}

async function getPokemonGroup(page) {
    try {
        const container = document.querySelector('#pokemon-list .grid');
        container.innerHTML = "";
        const start = page * pageSize + 1;
        const end = start + pageSize;

        progressBar.style.display = "block";

        const promises = [];
        for (let i = start; i < end; i++) {
            promises.push(fetchPokemon(i));
        }
        const results = await Promise.all(promises);

        results.forEach(pokemon => {
            const card = document.createElement('div');
            card.classList.add('pokemon-card');
            card.innerHTML = `
                <h3 class="pokemon-name">${pokemon.name} (#${pokemon.id})</h3>
                <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
            `;
            card.addEventListener('click', () => displayPokemon(pokemon));
            container.appendChild(card);
        });

        prevBtn.disabled = page === 0;

        for (let p = 1; p <= 2; p++) {
            const prefetchStart = (page + p) * pageSize + 1;
            const prefetchEnd = prefetchStart + pageSize;
            for (let i = prefetchStart; i < prefetchEnd; i++) {
                fetchPokemon(i);
            }
        }

    } catch (error) {
        console.error(error.message);
    } finally {
        progressBar.style.display = "none";
    }
}

prevBtn.addEventListener("click", () => {
    if (currentPage > 0) {
        currentPage--;
        getPokemonGroup(currentPage);
    }
});

nextBtn.addEventListener("click", () => {
    currentPage++;
    getPokemonGroup(currentPage);
});

getPokemonGroup(currentPage);
