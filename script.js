(function () {
  var rows = document.getElementById("rows");
  var addButton = document.getElementById("add-row");
  var grandTotal = document.getElementById("grand-total");
  var emptyNote = document.getElementById("empty-note");
  var fromInput = document.getElementById("from");
  var toInput = document.getElementById("to");
  var numberInput = document.getElementById("number");
  var dateInput = document.getElementById("date");
  var discountInput = document.getElementById("discount");
  var vatInput = document.getElementById("vat");
  var currencySelect = document.getElementById("currency");
  var breakdown = document.getElementById("breakdown");
  var commentInput = document.getElementById("comment");
  var commentPrint = document.getElementById("comment-print");
  var commentCard = document.getElementById("comment-card");
  var savePdfButton = document.getElementById("save-pdf");
  var copyButton = document.getElementById("copy-whatsapp");
  var newButton = document.getElementById("new-estimate");
  var copyStatus = document.getElementById("copy-status");
  var copyFallback = document.getElementById("copy-fallback");
  var copyText = document.getElementById("copy-text");
  var rowCount = 0;
  var currencies = { "₸": true, "₽": true, "$": true, "€": true };
  var units = { "шт": true, "час": true, "услуга": true };
  var STORAGE_KEY = "smeta-draft-v1";
  var lastCalc = null;
  var statusTimer = null;

  function todayValue() {
    var now = new Date();
    var month = String(now.getMonth() + 1).padStart(2, "0");
    var day = String(now.getDate()).padStart(2, "0");
    return now.getFullYear() + "-" + month + "-" + day;
  }

  function parseNumber(raw) {
    var text = String(raw == null ? "" : raw).trim().replace(/\s/g, "").replace(",", ".");
    if (text === "") {
      return 0;
    }
    var value = Number(text);
    return Number.isFinite(value) ? value : 0;
  }

  function currentCurrency() {
    var value = currencySelect ? currencySelect.value : "₸";
    return currencies[value] ? value : "₸";
  }

  function formatPercent(value) {
    var number = Number.isFinite(value) ? value : 0;
    var text = String(Math.round(number * 100) / 100);
    if (text.indexOf(".") !== -1) {
      text = text.replace(/0+$/, "").replace(/\.$/, "");
    }
    return text.replace(".", ",");
  }

  function formatMoney(value) {
    var amount = Number.isFinite(value) ? value : 0;
    var negative = amount < 0;
    var whole = String(Math.round(Math.abs(amount))).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return (negative ? "−" : "") + whole + " " + currentCurrency();
  }

  function formatQty(value) {
    return formatPercent(value);
  }

  function formatDate(value) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
    return match ? match[3] + "." + match[2] + "." + match[1] : "";
  }

  function percentOf(base, percent) {
    if (!Number.isFinite(base) || !Number.isFinite(percent)) {
      return 0;
    }
    return Math.round(base * percent / 100);
  }

  function renderBreakdown(lines) {
    breakdown.innerHTML = "";
    if (lines.length === 0) {
      breakdown.hidden = true;
      return;
    }
    breakdown.hidden = false;
    lines.forEach(function (line) {
      var row = document.createElement("div");
      row.className = "breakdown-row";
      var label = document.createElement("span");
      label.textContent = line.label;
      var value = document.createElement("span");
      value.className = "breakdown-value";
      value.textContent = formatMoney(line.amount);
      row.appendChild(label);
      row.appendChild(value);
      breakdown.appendChild(row);
    });
  }

  function updateEmptyNote() {
    emptyNote.hidden = rows.children.length > 0;
  }

  function recalc() {
    var subtotal = 0;
    var items = [];
    Array.prototype.forEach.call(rows.querySelectorAll("tr"), function (row) {
      var qty = parseNumber(row.querySelector('[name="qty"]').value);
      var price = parseNumber(row.querySelector('[name="price"]').value);
      var sum = Math.round(qty * price);
      if (!Number.isFinite(sum)) {
        sum = 0;
      }
      row.querySelector(".line-sum").textContent = formatMoney(sum);
      subtotal += sum;
      items.push({
        name: row.querySelector('[name="name"]').value.trim(),
        qty: qty,
        unit: row.querySelector('[name="unit"]').value,
        price: price,
        sum: sum
      });
    });
    if (!Number.isFinite(subtotal)) {
      subtotal = 0;
    }

    var discountPercent = parseNumber(discountInput.value);
    var vatPercent = parseNumber(vatInput.value);
    var discountAmount = percentOf(subtotal, discountPercent);
    var afterDiscount = subtotal - discountAmount;
    var vatAmount = percentOf(afterDiscount, vatPercent);
    var total = afterDiscount + vatAmount;
    if (!Number.isFinite(total)) {
      total = 0;
    }

    var lines = [];
    if (subtotal !== 0) {
      lines.push({ label: "Сумма позиций", amount: subtotal });
    }
    if (discountAmount !== 0) {
      lines.push({
        label: "Скидка " + formatPercent(discountPercent) + "%",
        amount: -discountAmount
      });
      lines.push({ label: "Сумма со скидкой", amount: afterDiscount });
    }
    if (vatAmount !== 0) {
      lines.push({
        label: "НДС " + formatPercent(vatPercent) + "%",
        amount: vatAmount
      });
    }
    renderBreakdown(lines);
    grandTotal.textContent = formatMoney(total);
    updateEmptyNote();

    lastCalc = { items: items, lines: lines, total: total };
    return lastCalc;
  }

  function addRow(data) {
    rowCount += 1;
    var index = rowCount;
    var row = document.createElement("tr");
    row.innerHTML =
      '<td data-label="Наименование">' +
        '<input type="text" name="name" aria-label="Наименование, позиция ' + index + '" placeholder="Что входит в смету">' +
      "</td>" +
      '<td data-label="Количество">' +
        '<input type="text" name="qty" inputmode="decimal" aria-label="Количество, позиция ' + index + '" autocomplete="off" placeholder="0">' +
      "</td>" +
      '<td data-label="Единица">' +
        '<select name="unit" aria-label="Единица, позиция ' + index + '">' +
          '<option value="шт">шт</option>' +
          '<option value="час">час</option>' +
          '<option value="услуга">услуга</option>' +
        "</select>" +
      "</td>" +
      '<td data-label="Цена">' +
        '<input type="text" name="price" inputmode="decimal" aria-label="Цена, позиция ' + index + '" autocomplete="off" placeholder="0">' +
      "</td>" +
      '<td class="line-sum" data-label="Сумма">' + formatMoney(0) + "</td>" +
      '<td data-label="Удалить">' +
        '<button type="button" class="delete">Удалить</button>' +
      "</td>";
    if (data) {
      row.querySelector('[name="name"]').value = data.name || "";
      row.querySelector('[name="qty"]').value = data.qty || "";
      row.querySelector('[name="unit"]').value = units[data.unit] ? data.unit : "шт";
      row.querySelector('[name="price"]').value = data.price || "";
    }
    rows.appendChild(row);
    updateEmptyNote();
    return row;
  }

  function updateCommentPrint() {
    var text = commentInput.value.trim();
    commentPrint.textContent = text;
    commentCard.classList.toggle("is-empty", text === "");
  }

  /* ---------- Черновик в браузере ---------- */

  function collectState() {
    return {
      from: fromInput.value,
      to: toInput.value,
      number: numberInput.value,
      date: dateInput.value,
      discount: discountInput.value,
      vat: vatInput.value,
      currency: currentCurrency(),
      comment: commentInput.value,
      rows: Array.prototype.map.call(rows.querySelectorAll("tr"), function (row) {
        return {
          name: row.querySelector('[name="name"]').value,
          qty: row.querySelector('[name="qty"]').value,
          unit: row.querySelector('[name="unit"]').value,
          price: row.querySelector('[name="price"]').value
        };
      })
    };
  }

  function saveDraft() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collectState()));
    } catch (error) {
      /* Хранилище недоступно — смета продолжает работать без черновика. */
    }
  }

  function loadDraft() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function applyState(state) {
    fromInput.value = state.from || "";
    toInput.value = state.to || "";
    numberInput.value = state.number || "";
    dateInput.value = state.date || todayValue();
    discountInput.value = state.discount || "";
    vatInput.value = state.vat || "";
    currencySelect.value = currencies[state.currency] ? state.currency : "₸";
    commentInput.value = state.comment || "";
    rows.innerHTML = "";
    rowCount = 0;
    var savedRows = Array.isArray(state.rows) ? state.rows : [];
    if (savedRows.length === 0) {
      addRow();
    } else {
      savedRows.forEach(function (item) {
        addRow(item);
      });
    }
  }

  function nextNumber(value) {
    var text = String(value || "").trim();
    if (text === "") {
      return "";
    }
    var match = /^(.*?)(\d+)(\D*)$/.exec(text);
    if (!match) {
      return text;
    }
    var next = String(Number(match[2]) + 1);
    while (next.length < match[2].length) {
      next = "0" + next;
    }
    return match[1] + next + match[3];
  }

  function startNewEstimate() {
    var ok = window.confirm("Начать новую смету? Позиции, клиент, скидка, НДС и комментарий будут очищены.");
    if (!ok) {
      return;
    }
    applyState({
      from: fromInput.value,
      to: "",
      number: nextNumber(numberInput.value),
      date: todayValue(),
      discount: "",
      vat: "",
      currency: currentCurrency(),
      comment: "",
      rows: []
    });
    copyFallback.hidden = true;
    showStatus("");
    refresh();
    toInput.focus();
  }

  /* ---------- Текст для WhatsApp ---------- */

  function buildWhatsAppText() {
    var calc = recalc();
    var number = numberInput.value.trim();
    var date = formatDate(dateInput.value);
    var title = "Смета" + (number ? " №" + number : "") + (date ? " от " + date : "");
    var parts = ["*" + title + "*"];
    if (fromInput.value.trim()) {
      parts.push("От: " + fromInput.value.trim());
    }
    if (toInput.value.trim()) {
      parts.push("Для: " + toInput.value.trim());
    }
    parts.push("");

    var lineNo = 0;
    calc.items.forEach(function (item) {
      if (!item.name && item.sum === 0) {
        return;
      }
      lineNo += 1;
      parts.push(
        lineNo + ". " + (item.name || "Позиция") + " — " +
        formatQty(item.qty) + " " + item.unit + " × " + formatMoney(item.price) +
        " = " + formatMoney(item.sum)
      );
    });
    if (lineNo === 0) {
      parts.push("Позиций нет");
    }
    parts.push("");

    calc.lines.forEach(function (line) {
      parts.push(line.label + ": " + formatMoney(line.amount));
    });
    parts.push("*Итого к оплате: " + formatMoney(calc.total) + "*");

    var comment = commentInput.value.trim();
    if (comment) {
      parts.push("");
      parts.push("Комментарий: " + comment);
    }
    return parts.join("\n");
  }

  function showStatus(text) {
    copyStatus.textContent = text;
    if (statusTimer) {
      clearTimeout(statusTimer);
    }
    if (text) {
      statusTimer = setTimeout(function () {
        copyStatus.textContent = "";
      }, 3000);
    }
  }

  function copyWithTextarea(text) {
    var helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (error) {
      ok = false;
    }
    document.body.removeChild(helper);
    return ok;
  }

  function showFallback(text) {
    copyText.value = text;
    copyFallback.hidden = false;
    copyText.focus();
    copyText.select();
    showStatus("");
  }

  function copyForWhatsApp() {
    var text = buildWhatsAppText();
    copyFallback.hidden = true;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () {
        showStatus("Скопировано ✓");
      }, function () {
        if (copyWithTextarea(text)) {
          showStatus("Скопировано ✓");
        } else {
          showFallback(text);
        }
      });
      return;
    }
    if (copyWithTextarea(text)) {
      showStatus("Скопировано ✓");
    } else {
      showFallback(text);
    }
  }

  /* ---------- Запуск ---------- */

  function refresh() {
    recalc();
    updateCommentPrint();
    saveDraft();
  }

  var draft = loadDraft();
  if (draft) {
    applyState(draft);
  } else {
    dateInput.value = todayValue();
    addRow();
  }
  refresh();

  addButton.addEventListener("click", function () {
    var row = addRow();
    row.querySelector('[name="name"]').focus();
    refresh();
  });

  document.querySelector(".page").addEventListener("input", function (event) {
    if (event.target === copyText) {
      return;
    }
    refresh();
  });

  document.querySelector(".page").addEventListener("change", function (event) {
    if (event.target === copyText) {
      return;
    }
    refresh();
  });

  rows.addEventListener("click", function (event) {
    var button = event.target.closest("button.delete");
    if (!button) {
      return;
    }
    var row = button.closest("tr");
    if (row) {
      row.remove();
    }
    refresh();
    addButton.focus();
  });

  savePdfButton.addEventListener("click", function () {
    updateCommentPrint();
    window.print();
  });

  copyButton.addEventListener("click", function () {
    copyForWhatsApp();
  });

  newButton.addEventListener("click", function () {
    startNewEstimate();
  });
})();
