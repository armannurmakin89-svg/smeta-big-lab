(function () {
  var rows = document.getElementById("rows");
  var addButton = document.getElementById("add-row");
  var grandTotal = document.getElementById("grand-total");
  var emptyNote = document.getElementById("empty-note");
  var dateInput = document.getElementById("date");
  var rowCount = 0;

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

  function formatMoney(value) {
    var amount = Number.isFinite(value) ? value : 0;
    var negative = amount < 0;
    var rounded = Math.round(Math.abs(amount) * 100) / 100;
    var parts = rounded.toFixed(2).split(".");
    var whole = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    var text = parts[1] === "00" ? whole : whole + "," + parts[1];
    return (negative ? "−" : "") + text + " ₸";
  }

  function updateEmptyNote() {
    emptyNote.hidden = rows.children.length > 0;
  }

  function recalc() {
    var total = 0;
    Array.prototype.forEach.call(rows.querySelectorAll("tr"), function (row) {
      var qty = parseNumber(row.querySelector('[name="qty"]').value);
      var price = parseNumber(row.querySelector('[name="price"]').value);
      var sum = qty * price;
      if (!Number.isFinite(sum)) {
        sum = 0;
      }
      row.querySelector(".line-sum").textContent = formatMoney(sum);
      total += sum;
    });
    if (!Number.isFinite(total)) {
      total = 0;
    }
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
      '<td class="line-sum" data-label="Сумма">0 ₸</td>' +
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
