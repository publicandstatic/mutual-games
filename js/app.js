/*default start*/
var canvas = document.getElementById('background-сanvas');
var context = canvas.getContext('2d');
var colors = ["#00bfcb", "#18d3bc", "#5b82c8", "#3396cf"];
var fps = 15;
var now;
var then = Date.now();
var num = 2;
var delta;
var tamanho = 50;
var ismobile = false;
var varpi = 2 * Math.PI;
var interval = 1000 / fps;
var objforDraw = new Array();

document.addEventListener("DOMContentLoaded", function () {
    window.requestAnimFrame = (function () {
        return window.requestAnimationFrame || window
                .webkitRequestAnimationFrame || window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
            function (callback) {
                return window.setTimeout(callback,
                    1000 / fps)
            }
    })();
    window.cancelRequestAnimFrame = (function () {
        return window.cancelAnimationFrame || window.webkitCancelRequestAnimationFrame ||
            window.mozCancelRequestAnimationFrame ||
            window.oCancelRequestAnimationFrame ||
            window.msCancelRequestAnimationFrame ||
            clearTimeout
    })();
    var ShadowObject = function (color) {
        this.x = ((Math.random() * canvas.width) + 10);
        this.y = ((Math.random() * canvas.height) + 10);
        this.color = color;
        this.size = tamanho;
        this.dirX = Math.random() < 0.5 ? -1 : 1;
        this.dirY = Math.random() < 0.5 ? -1 : 1;
        this.checkIsOut = function () {
            if ((this.x > canvas.width + (this.size /
                2)) || (this.x < 0 - (this.size /
                2))) {
                this.dirX = this.dirX * -1
            }
            ;
            if ((this.y > canvas.height + (this.size /
                2)) || (this.y < 0 - (this.size /
                2))) {
                this.dirY = this.dirY * -1
            }
        };
        this.move = function () {

            this.x += this.dirX * 2;
            this.y += this.dirY * 2

        }
    };

    function draw() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        var len = objforDraw.length;
        for (i = 0; i < len; i++) {
            context.beginPath();
            context.arc(objforDraw[i].x, objforDraw[i].y, objforDraw[i].size, 0, varpi, false);
            context.fillStyle = objforDraw[i].color;
            context.shadowColor = objforDraw[i].color;
            if (ismobile == false) {
                context.shadowBlur = 50;
                context.shadowOffsetX = 0;
                context.shadowOffsetY = 0;
            }
            context.fill();
            objforDraw[i].checkIsOut();
            objforDraw[i].move()
        }
    };

    function animloop() {
        requestAnimFrame(animloop);
        now = Date.now();
        delta = now - then;
        if (delta > interval) {
            draw();
            then = now - (delta % interval)
        }
    };
    document.body.onload = function (e) {
        for (i = 0; i < colors.length * num; i++) {
            var color = ((i >= colors.length) ? colors[(i -
                colors.length)] : colors[i]);
            objforDraw.push(new ShadowObject(color))
        }
        ;
        animloop()
    };
});
/*default end*/

let allGames = [];
const multiplayerCategoryIds = [1, 9, 20, 24, 27, 36, 37, 38, 39, 44, 47, 48, 49];
const modal = new bootstrap.Modal(document.getElementById('fullscreenModal'));

async function findGames() {
    const inputs = document.querySelectorAll('#form input[type="text"]');
    const profiles = Array.from(inputs)
        .map(input => input.value.trim())
        .filter(url => url !== '');

    const errorEl = document.getElementById('error');
    const resultsEl = document.getElementById('results');
    const filtersEl = document.getElementById('filters');
    errorEl.textContent = '';
    errorEl.style.display = 'none';
    resultsEl.innerHTML = '';
    filtersEl.style.display = 'none';

    if (profiles.length < 2) {
        errorEl.textContent = 'Вкажи щонайменше два Steam-профілі.';
        errorEl.style.display = 'block';
        return;
    }

    modal.show();

    const params = new URLSearchParams();
    profiles.forEach(p => params.append('profiles[]', p));

    try {
        const response = await fetch('https://api-1pu7.onrender.com/getMutualGames.php?' + params.toString());
        if (!response.ok) {
            if (response.status === 404) {
                errorEl.textContent = 'Сервер недоступний або сторінку не знайдено (404).';
            } else {
                const data = await response.json();
                if (data.error) {
                    errorEl.textContent = data.error;
                } else {
                    errorEl.textContent = `Помилка ${response.status}: ${response.statusText}`;
                }
            }
            errorEl.style.display = 'block';
            modal.hide();
            return;
        }

        const data = await response.json();
        if (data.error) {
            errorEl.textContent = data.error;
            errorEl.style.display = 'block';
            modal.hide();
            return;
        }

        allGames = data.common_games || [];

        const datalist = document.getElementById('gameList');
        datalist.innerHTML = allGames.map(game => `<option value="${game.name}">`).join('');

        filtersEl.style.display = 'block';

        document.getElementById('filterMultiplayer').addEventListener('change', renderGames);
        document.getElementById('gameSearch').addEventListener('input', renderGames);

        renderGames();
        renderPlayerSummaries(data.players_summary, data.count);
        modal.hide();
    } catch (err) {
        errorEl.textContent = 'Сталася помилка під час запиту до API: ' + err.message;
        errorEl.style.display = 'block';
        modal.hide();
    }
}

function renderGames() {
    const resultsEl = document.getElementById('results');
    const searchTerm = document.getElementById('gameSearch').value.trim().toLowerCase();
    const filterMultiplayer = document.getElementById('filterMultiplayer').checked;

    const filtered = allGames.filter(game => {
        if (searchTerm && !game.name.toLowerCase().includes(searchTerm)) return false;
        if (filterMultiplayer && !game.category_ids?.some(id => multiplayerCategoryIds.includes(id))) return false;
        return true;
    }).sort((a, b) => a.name.localeCompare(b.name));

    if (!filtered.length) {
        resultsEl.innerHTML = '<div className="alert alert-secondary" role="alert">Не знайдено ігри з вибраними фільтрами.</div>';
        return;
    }

    resultsEl.innerHTML = '';
    for (const game of filtered) {
        const div = document.createElement('div');
        div.className = 'game row';
        div.innerHTML = `
          <div class="col-md-3 mb-3 mb-md-0">
            <img src="${game.header_image}" class="img-fluid" alt="${game.name}">
          </div>
          <div class="col-md-9">
            <h4><a href="${game.steam_url}" target="_blank" class="text-white">${game.name}</a></h4>
            <p class="text-muted">${game.short_description || ''}</p>
            <p class="text-muted"><strong>Жанри:</strong> ${game.genres?.join(', ') || '—'}</p>
            <p class="text-muted"><strong>Категорії:</strong> ${game.categories?.join(', ') || '—'}</p>
          </div>
        `;
        resultsEl.appendChild(div);
    }
}

function renderPlayerSummaries(players, mutualCount) {
    const container = document.getElementById('playerSummaries');
    container.innerHTML = ''; // очищення попереднього виводу

    players.forEach(player => {
        const div = document.createElement('div');
        div.className = 'd-flex align-items-center mb-2';

        div.innerHTML = `
      <img src="${player.avatar}" alt="avatar" class="me-2 rounded-circle" width="32" height="32">
      <a href="${player.profile_url}" target="_blank" class="text-white text-decoration-none">${player.personaname}</a>
    `;

        container.appendChild(div);
    });

    const info = document.createElement('div');
    info.className = 'mt-2 text-muted';
    info.textContent = `— мають ${mutualCount} спільних ігор`;
    container.appendChild(info);
}