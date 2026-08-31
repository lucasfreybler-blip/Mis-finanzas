(() => {
  const KEY = "misFinanzasPricesV1";

  const load = () =>
    JSON.parse(
      localStorage.getItem(KEY) ||
      '{"products":[],"shopping":[]}'
    );

  let db = load();

  const save = () =>
    localStorage.setItem(KEY, JSON.stringify(db));

  const money = n =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0
    }).format(n || 0);

  const esc = s =>
    String(s ?? "").replace(
      /[&<>"']/g,
      m => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[m])
    );

  const nav = document.querySelector("nav");
  const main = document.querySelector("main");

  if (!nav || !main) return;

  const style = document.createElement("style");

  style.textContent = `
    .pf-card{
      background:#fff;
      margin:8px 16px;
      padding:15px;
      border-radius:16px;
      box-shadow:0 1px 5px #0000000d
    }

    .pf-row{
      display:flex;
      justify-content:space-between;
      gap:10px
    }

    .pf-muted{
      color:#6b7280;
      font-size:13px
    }

    .pf-actions{
      display:flex;
      gap:8px;
      margin-top:10px
    }

    .pf-actions button{
      flex:1;
      border:0;
      border-radius:10px;
      padding:10px;
      background:#f3f4f6
    }

    .pf-price{
      font-size:21px;
      font-weight:800
    }

    .pf-up{
      color:#b91c1c
    }

    .pf-down{
      color:#15803d
    }

    .pf-empty{
      padding:28px 16px;
      text-align:center;
      color:#6b7280
    }
  `;

  document.head.appendChild(style);

  const btn = document.createElement("button");

  btn.dataset.nav = "prices";

  btn.innerHTML = `
    🛒
    <small>Precios</small>
  `;

  nav.appendChild(btn);

  const section = document.createElement("section");

  section.id = "prices";
  section.className = "screen";

  section.innerHTML = `
    <div class="section-title">
      <h2>🛒 Precios</h2>
      <button id="pfAdd">＋ Producto</button>
    </div>

    <div class="pf-card">
      <div class="pf-row">
        <span>Productos</span>
        <b id="pfCount">0</b>
      </div>

      <div class="pf-row">
        <span>Última actualización</span>
        <b id="pfLast">—</b>
      </div>
    </div>

    <div id="pfProducts"></div>

    <h3 style="margin-left:20px">
      📝 Lista de compras
    </h3>

    <div id="pfShopping"></div>

    <div class="pf-card">
      <div class="pf-row">
        <b>Total estimado</b>
        <b id="pfTotal">$0</b>
      </div>
    </div>
  `;

  main.appendChild(section);

  function showModal(title, html) {

    const modal = document.querySelector("#modal");

    if (!modal) {
      alert(
        "No se encontró el sistema de formularios de Mis Finanzas."
      );
      return;
    }

    document.querySelector("#modalTitle").textContent =
      title;

    document.querySelector("#modalBody").innerHTML =
      html;

    modal.classList.remove("hidden");
  }

  function closeModal() {

    document
      .querySelector("#modal")
      ?.classList.add("hidden");
  }

  function formProduct(p = null) {

    showModal(
      p
        ? "Actualizar precio"
        : "Nuevo producto",

      `
      <form id="pfForm">

        <label>Producto</label>

        <input
          name="name"
          required
          value="${esc(p?.name || "")}"
          placeholder="Ej. Yerba">

        <label>Precio</label>

        <input
          name="price"
          type="number"
          min="0"
          required
          value="${p?.price || ""}">

        <label>Presentación</label>

        <input
          name="unit"
          value="${esc(p?.unit || "unidad")}"
          placeholder="1 kg, 1 litro, pack">

        <label>Comercio / proveedor</label>

        <input
          name="store"
          value="${esc(p?.store || "")}"
          placeholder="Carrefour, Día, proveedor...">

        <label>Fecha</label>

        <input
          name="date"
          type="date"
          required
          value="${
            p?.updated ||
            new Date().toISOString().slice(0,10)
          }">

        <button type="submit">
          Guardar
        </button>

      </form>
      `
    );

    document.querySelector("#pfForm").onsubmit =
      e => {

        e.preventDefault();

        const f = new FormData(e.target);

        const price =
          +f.get("price");

        const date =
          f.get("date");

        if (p) {

          p.name = f.get("name");
          p.price = price;
          p.unit = f.get("unit");
          p.store = f.get("store");
          p.updated = date;

          p.history.push({
            price,
            date,
            store: p.store
          });

        } else {

          db.products.push({

            id: Date.now(),

            name: f.get("name"),

            price,

            unit: f.get("unit"),

            store: f.get("store"),

            updated: date,

            history: [
              {
                price,
                date,
                store: f.get("store")
              }
            ]

          });

        }

        save();

        closeModal();

        render();
      };
  }

  function history(p) {

    showModal(
      p.name,

      `
      <p class="pf-muted">
        Historial de precios
      </p>

      ${
        [...p.history]
          .reverse()
          .map(h => `

            <div class="pf-card">

              <div class="pf-row">

                <b>
                  ${money(h.price)}
                </b>

                <span>
                  ${esc(h.date)}
                </span>

              </div>

              <small>
                ${esc(
                  h.store ||
                  "Sin comercio"
                )}
              </small>

            </div>

          `)
          .join("")
      }
      `
    );
  }

  function addShopping(p) {

    showModal(
      "Agregar a lista",

      `
      <form id="pfShop">

        <p>
          <b>${esc(p.name)}</b>
          —
          ${money(p.price)}
        </p>

        <label>Cantidad</label>

        <input
          name="qty"
          type="number"
          min="1"
          value="1"
          required>

        <button type="submit">
          Agregar
        </button>

      </form>
      `
    );

    document.querySelector("#pfShop").onsubmit =
      e => {

        e.preventDefault();

        const qty =
          +new FormData(e.target).get("qty");

        db.shopping.push({

          id: Date.now(),

          productId: p.id,

          qty

        });

        save();

        closeModal();

        render();
      };
  }

  function render() {

    document
      .querySelectorAll(".screen")
      .forEach(
        x => x.classList.remove("active")
      );

    const active =
      document.querySelector(".screen.active");

    if (
      active &&
      active.id === "prices"
    ) {

      section.classList.add("active");

    }

    document.querySelector("#pfCount")
      .textContent =
      db.products.length;

    document.querySelector("#pfLast")
      .textContent =
      db.products
        .map(p => p.updated)
        .sort()
        .pop() || "—";

    document.querySelector("#pfProducts")
      .innerHTML =

      db.products.length

        ? db.products.map(p => {

            const prev =
              p.history.length > 1
                ? p.history[
                    p.history.length - 2
                  ].price
                : null;

            const diff =
              prev === null
                ? 0
                : ((p.price - prev) / prev) * 100;

            const cls =
              diff > 0
                ? "pf-up"
                : diff < 0
                ? "pf-down"
                : "pf-muted";

            const txt =
              prev === null
                ? "Primer precio"
                : `${
                    diff > 0
                      ? "▲"
                      : "▼"
                  } ${Math.abs(diff).toFixed(1)}%`;

            return `

              <div class="pf-card">

                <div class="pf-row">

                  <div>

                    <b>
                      ${esc(p.name)}
                    </b>

                    <div class="pf-muted">

                      ${esc(
                        p.unit ||
                        "unidad"
                      )}

                      ${
                        p.store
                          ? " · " +
                            esc(p.store)
                          : ""
                      }

                    </div>

                  </div>

                  <div
                    style="text-align:right">

                    <div class="pf-price">

                      ${money(p.price)}

                    </div>

                    <div class="${cls}">

                      ${txt}

                    </div>

                  </div>

                </div>

                <div class="pf-muted">

                  Actualizado
                  ${esc(p.updated)}

                </div>

                <div class="pf-actions">

                  <button
                    onclick="
                      window.__pfEdit(${p.id})
                    ">

                    Actualizar

                  </button>

                  <button
                    onclick="
                      window.__pfHist(${p.id})
                    ">

                    Historial
                    (${p.history.length})

                  </button>

                  <button
                    onclick="
                      window.__pfBuy(${p.id})
                    ">

                    ＋ Compra

                  </button>

                </div>

              </div>

            `;

          }).join("")

        : `

          <div class="pf-empty">

            Todavía no hay productos.

            <br><br>

            Agregá el primero con
            <b>＋ Producto</b>.

          </div>

        `;

    let total = 0;

    document.querySelector("#pfShopping")
      .innerHTML =

      db.shopping.length

        ? db.shopping.map(x => {

            const p =
              db.products.find(
                p => p.id === x.productId
              );

            if (!p) return "";

            const sub =
              p.price * x.qty;

            total += sub;

            return `

              <div class="pf-card">

                <div class="pf-row">

                  <div>

                    <b>
                      ${esc(p.name)}
                    </b>

                    <div class="pf-muted">

                      ${x.qty}
                      ×
                      ${money(p.price)}

                    </div>

                  </div>

                  <b>
                    ${money(sub)}
                  </b>

                </div>

                <div class="pf-actions">

                  <button
                    onclick="
                      window.__pfDelBuy(${x.id})
                    ">

                    Quitar

                  </button>

                </div>

              </div>

            `;

          }).join("")

        : `

          <div class="pf-empty">

            La lista está vacía.

          </div>

        `;

    document.querySelector("#pfTotal")
      .textContent =
      money(total);
  }

  window.__pfEdit = id =>
    formProduct(
      db.products.find(
        p => p.id === id
      )
    );

  window.__pfHist = id =>
    history(
      db.products.find(
        p => p.id === id
      )
    );

  window.__pfBuy = id =>
    addShopping(
      db.products.find(
        p => p.id === id
      )
    );

  window.__pfDelBuy = id => {

    db.shopping =
      db.shopping.filter(
        x => x.id !== id
      );

    save();

    render();
  };

  btn.onclick = () => {

    document
      .querySelectorAll(".screen")
      .forEach(
        x => x.classList.remove("active")
      );

    section.classList.add("active");

    render();
  };

  document.querySelector("#pfAdd").onclick =
    () => formProduct();

  render();

})();
