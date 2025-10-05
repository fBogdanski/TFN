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

async function getPokemon(nameOrId) {
    const url = `https://pokeapi.co/api/v2/pokemon/${nameOrId}`;
    try {
        progressBar.style.display = "block";

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Response status: ${response.status}`);

        const p = await response.json();
        const container = document.querySelector('.pokemon-card.detailed');

        const abilityDetails = await Promise.all(
            p.abilities.map(async (a) => {
                const res = await fetch(a.ability.url);
                const data = await res.json();
                const effectEntry = data.effect_entries.find(e => e.language.name === 'en');
                return {
                    name: a.ability.name,
                    effect: effectEntry ? effectEntry.effect : "No effect info"
                };
            })
        );

        container.innerHTML = `
            <h3>${p.name} (#${p.id})</h3>
            <img src="${p.sprites.front_default}" alt="${p.name}" width="120" height="120">
            <div class="info">
                <p><strong>Type:</strong> ${p.types.map(t => t.type.name).join(', ')}</p>
                <p><strong>Height:</strong> ${p.height}</p>
                <p><strong>Weight:</strong> ${p.weight}</p>
                <p><strong>Base Stats:</strong></p>
                <ul>
                    ${p.stats.map(stat => `<li>${stat.stat.name}: ${stat.base_stat}</li>`).join('')}
                </ul>
                <p><strong>Abilities:</strong></p>
                <ul>
                    ${abilityDetails.map(a => `<li><strong>${a.name}:</strong> ${a.effect}</li>`).join('')}
                </ul>
            </div>
        `;

    } catch (error) {
        console.error(error.message);
        const container = document.querySelector('.pokemon-card.detailed');
        container.innerHTML = `<p>Pokémon not found. Please check the name or ID.</p>`;
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
            container.innerHTML += `
                <div class="pokemon-card">
                    <h3 class="pokemon-name">${pokemon.name} (#${pokemon.id})</h3>
                    <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
                    <div class="tooltip">
                        <p><strong>Type:</strong> ${pokemon.types.map(t => t.type.name).join(', ')}</p>
                        <p><strong>Height:</strong> ${pokemon.height}</p>
                        <p><strong>Weight:</strong> ${pokemon.weight}</p>
                        <p><strong>Base Stats:</strong></p>
                        <ul>
                            ${pokemon.stats.map(stat => `<li>${stat.stat.name}: ${stat.base_stat}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `;
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
