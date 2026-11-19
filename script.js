(function () {
  var rows = document.getElementById("rows");
  var addButton = document.getElementById("add-row");
  var grandTotal = document.getElementById("grand-total");
  var emptyNote = document.getElementById("empty-note");
  var dateInput = document.getElementById("date");
  var discountInput = document.getElementById("discount");
  var vatInput = document.getElementById("vat");
  var currencySelect = document.getElementById("currency");
  var breakdown = document.getElementById("breakdown");
  var rowCount = 0;
  var currencies = { "₸": true, "₽": true, "$": true, "€": true };

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
    Array.prototype.forEach.call(rows.querySelectorAll("tr"), function (row) {
      var qty = parseNumber(row.querySelector('[name="qty"]').value);
      var price = parseNumber(row.querySelector('[name="price"]').value);
      var sum = Math.round(qty * price);
      if (!Number.isFinite(sum)) {
        sum = 0;
      }
      row.querySelector(".line-sum").textContent = formatMoney(sum);
      subtotal += sum;
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
  }

  function addRow() {
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
    rows.appendChild(row);
    updateEmptyNote();
    row.querySelector('[name="name"]').focus();
  }

  dateInput.value = todayValue();

  addButton.addEventListener("click", function () {
    addRow();
  });

  rows.addEventListener("input", function () {
    recalc();
  });

  discountInput.addEventListener("input", function () {
    recalc();
  });

  vatInput.addEventListener("input", function () {
    recalc();
  });

  currencySelect.addEventListener("change", function () {
    recalc();
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
    recalc();
    addButton.focus();
  });

  addRow();
  var firstName = rows.querySelector('[name="name"]');
  if (firstName) {
    firstName.blur();
  }
})();
