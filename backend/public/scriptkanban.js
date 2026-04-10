
// DRAG DE COLUNA

let colunaArrastando = null;
let modoModal = "card";
let cardEditandoId = null;

document.addEventListener("dragstart", e => {
    if (e.target.classList.contains("kanban-column")) {
        colunaArrastando = e.target;
        e.target.classList.add("dragging-column");
    }

    if (e.target.classList.contains("kanban-card")) {
        e.target.classList.add("dragging");
    }
});

document.addEventListener("dragend", async e => {
    document.querySelectorAll(".dragging")
        .forEach(el => el.classList.remove("dragging"));

    document.querySelectorAll(".dragging-column")
        .forEach(el => el.classList.remove("dragging-column"));

    if (!colunaArrastando) return;

    const colunas = document.querySelectorAll(".kanban-column");

    for (let i = 0; i < colunas.length; i++) {
        const id = colunas[i].dataset.id;

        await fetch(`/colunas/${id}/ordem`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `ordem=${i}`
        });
    }

    colunaArrastando = null;
});

document.addEventListener("dragover", e => {
    if (colunaArrastando && e.target.closest(".kanban-column")) {
        e.preventDefault();

        const container = document.querySelector(".kanban");
        const colunaAlvo = e.target.closest(".kanban-column");

        if (!colunaAlvo || colunaArrastando === colunaAlvo) return;

        const colunas = [...document.querySelectorAll(".kanban-column")];

        const posicoesAntes = colunas.map(col => col.getBoundingClientRect());

        const rect = colunaAlvo.getBoundingClientRect();
        const meio = rect.left + rect.width / 2;

        if (e.clientX > meio) {
            container.insertBefore(colunaArrastando, colunaAlvo.nextSibling);
        } else {
            container.insertBefore(colunaArrastando, colunaAlvo);
        }

        const colunasDepois = [...document.querySelectorAll(".kanban-column")];

        colunasDepois.forEach((col, i) => {
            const posAntes = posicoesAntes[i];
            const posDepois = col.getBoundingClientRect();

            const dx = posAntes.left - posDepois.left;

            if (dx !== 0) {
                col.style.transition = "none";
                col.style.transform = `translateX(${dx}px)`;

                requestAnimationFrame(() => {
                    col.style.transition = "transform 0.25s ease";
                    col.style.transform = "";
                });
            }
        });
    }

    if (e.target.closest(".kanban-cards")) {
        e.preventDefault();
    }
});

document.addEventListener("drop", async e => {
    const coluna = e.target.closest(".kanban-cards");

    if (coluna) {
        const dragCard = document.querySelector(".dragging");
        if (!dragCard) return;

        const colunaId = coluna.dataset.id;

        coluna.appendChild(dragCard);

        const cardId = dragCard.dataset.id;

        await fetch(`/cards/${cardId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `coluna_id=${colunaId}`
        });
    }
});


// MODAL


function abrirModal(id, titulo) {
    modoModal = "card";

    document.getElementById("modal").classList.remove("hidden");
    document.getElementById("modal-input").style.display = "block";
    document.getElementById("coluna-nome").style.display = "none";
    document.getElementById("coluna-cor").style.display = "none";

    document.getElementById("modal-input").value = titulo;
    cardEditandoId = id;
}

function abrirModalColuna() {
    modoModal = "coluna";

    document.getElementById("modal").classList.remove("hidden");

    document.getElementById("modal-input").style.display = "none";
    document.getElementById("coluna-nome").style.display = "block";
    document.getElementById("coluna-cor").style.display = "block";
}

function fecharModal() {
    document.getElementById("modal").classList.add("hidden");

    modoModal = "card";

    document.getElementById("modal-input").style.display = "block";
    document.getElementById("coluna-nome").style.display = "none";
    document.getElementById("coluna-cor").style.display = "none";
}

async function salvarEdicao() {
    if (modoModal === "card") {
        const novoTitulo = document.getElementById("modal-input").value;

        if (!novoTitulo) return;

        await fetch(`/cards/${cardEditandoId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `titulo=${novoTitulo}`
        });
    }

    if (modoModal === "coluna") {
        const nome = document.getElementById("coluna-nome").value;
        const cor = document.getElementById("coluna-cor").value;

        if (!nome) return;

        await fetch("/colunas", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `nome=${nome}&cor=${cor}`
        });
    }

    fecharModal();
    carregarColunas();
}

async function deletarCard() {
    if (!confirm("Tem certeza que deseja excluir este card?")) return;

    await fetch(`/cards/${cardEditandoId}`, {
        method: "DELETE"
    });

    fecharModal();
    carregarColunas();
}


// COLUNAS


async function carregarColunas() {
    const res = await fetch("/colunas");
    const colunas = await res.json();

    const container = document.querySelector(".kanban");
    container.innerHTML = "";

    colunas.forEach(coluna => {
        const div = document.createElement("div");

        div.classList.add("kanban-column");
        div.setAttribute("draggable", "true");
        div.dataset.id = coluna.id;

        div.style.setProperty("--cor-coluna", coluna.cor || "#00662c");

        div.innerHTML = `
            <div class="kanban-title">
                <h2 onclick="editarNomeColuna(this, ${coluna.id})">${coluna.nome}</h2>

                <div style="display:flex; gap:10px;">
                    <button class="add-card" onclick="criarCard(${coluna.id})">+</button>
                    <button onclick="deletarColuna(${coluna.id})">🗑</button>
                </div>
            </div>

            <div class="kanban-cards" data-id="${coluna.id}"></div>
        `;

        container.appendChild(div);
    });

    carregarCards();
}

function editarNomeColuna(elemento, colunaId) {
    const input = document.createElement("input");
    input.value = elemento.innerText;

    elemento.replaceWith(input);
    input.focus();

    input.addEventListener("blur", () => salvarNomeColuna(input, colunaId));
}

async function salvarNomeColuna(input, colunaId) {
    await fetch(`/colunas/${colunaId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `nome=${input.value}`
    });

    carregarColunas();
}

async function deletarColuna(colunaId) {
    await fetch(`/colunas/${colunaId}`, { method: "DELETE" });
    carregarColunas();
}


// CARDS


async function criarCard(coluna_id) {
    const titulo = prompt("Título do card:");
    if (!titulo) return;

    await fetch("/cards", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `titulo=${titulo}&coluna_id=${coluna_id}`
    });

    carregarColunas();
}

async function carregarCards() {
    const res = await fetch("/cards");
    const cards = await res.json();

    cards.forEach(card => {
        const cardDiv = document.createElement("div");

        cardDiv.classList.add("kanban-card");
        cardDiv.setAttribute("draggable", "true");
        cardDiv.dataset.id = card.id;

        cardDiv.innerHTML = `<p>${card.titulo}</p>`;

        cardDiv.onclick = () => abrirModal(card.id, card.titulo);

        const coluna = document.querySelector(
            `.kanban-cards[data-id="${card.coluna_id}"]`
        );

        if (coluna) coluna.appendChild(cardDiv);
    });
}

carregarColunas();