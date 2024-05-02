const orderIdColorMap = {};
let currentIndex = 0;
let theme = undefined;
let boje = undefined;
let sveBoje = [];
let mojaBoja = undefined;
let uIzradi = []
let odabraniRadnik = undefined
let bitniArtikli = undefined
let onOffCollors = false;
let settings = { onOffCollors: false, highlightArticle: 0 };
const allTicketItems = {};

const poslovnica = "CCOE"
const tabContent = document.querySelector(".tab-content")
const notificirajArtikli = [1424, 1425, 1426, 1429, 1430, 1434, 1435, 1437, 1441, 1468, 1475, 1488, 1491, 1492, 1520, 1521, 1524, 1581, 1582, 1583, 1584, 1585, 1587, 1588, 1589, 1590, 1591, 1593, 1594, 1595, 1597, 1598, 1871, 1872, 1884, 1886, 1887, 1888, 1889, 1890, 1891, 1924, 1925, 1947, 1948]
const notificirajElementi = []

let glowElement = document.querySelector(".glow")

let storedSettings = JSON.parse(localStorage.getItem("settings"))
if (storedSettings) {
  settings = storedSettings
  bitniArtikli = settings.highlightArticle
}


function hexToRgba(hex) {
  hex = hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (m, r, g, b) => {
    return r + r + g + g + b + b;
  });

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error("Invalid HEX color format");
  }

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `rgba(${r}, ${g}, ${b}, ${0.5})`;
}

function chooseNextColor() {

  const colorCount = boje.length;
  if (currentIndex >= colorCount) {
    currentIndex = 0;
  }
  const nextColor = boje[currentIndex];
  currentIndex++;
  return nextColor;
}


function addItemToAllItems(itemName, itemId) {
  allTicketItems[itemId] = { itemName, itemId };
}

function processTicket(tbody) {
  const ticketItems = tbody.querySelectorAll(".ticket-item");

  ticketItems.forEach(item => {
    const itemName = item.querySelector("dt").innerText.trim();
    const itemId = parseInt(item.getAttribute("product-id"));
    addItemToAllItems(itemName, itemId);
  });

  const sortedItems = Object.values(allTicketItems).sort((a, b) => a.itemId - b.itemId);
  localStorage.setItem('sortedItems', JSON.stringify(sortedItems));

  chrome.runtime.sendMessage({ allTicketItems: sortedItems }, function (response) {

    // Ovdje možete obraditi odgovor ako je potrebno
  });
}


function changeColor(tbodyElements) {
  tbodyElements.forEach((tbody) => {
    if (tbody.classList.contains("zero-progress-ticket")) {
      const ticketId = tbody.getAttribute("ticketid");
      let color;
      if (orderIdColorMap[ticketId]) {
        color = orderIdColorMap[ticketId];
      } else {
        color = chooseNextColor();
        orderIdColorMap[ticketId] = color;
      }
      const innerDiv = tbody.querySelector(".ticket_first_half_completed");
      if (innerDiv) {
        innerDiv.style.backgroundColor = color;
      }
      applyStylingToNewElement(tbody, color);
    }
  });

  function handleTbodyClick(event) {
    const currentlySelected = document.querySelector(".selected-ticket");
    if (currentlySelected !== null) {
      currentlySelected.style.outline = "none";
      currentlySelected.classList.remove("selected-ticket");
    }
    const clickedElement = event.currentTarget;
    clickedElement.classList.add("selected-ticket");
    clickedElement.style.setProperty("outline", "5px solid red", "!important");
  }

  tbodyElements.forEach((tbody) => {
    if (tbody.classList.contains("zero-progress-ticket")) {
      tbody.addEventListener("click", handleTbodyClick);
    }
  });
}

function processThemes(themes) {
  const storedTheme = localStorage.getItem('theme');
  const tbodyElements = document.querySelectorAll("#mainTableRow tbody.zero-progress-ticket");

  themes.forEach((tema) => {
    const temaNaziv = tema.theme;
    boje = JSON.parse(tema.colors);
    sveBoje.push({ tema: temaNaziv, boje: boje });
  });

  setInitialTheme(tbodyElements, storedTheme);
}

function setInitialTheme(tbodyElements, storedTheme) {
  let themeIndex = sveBoje.findIndex(item => item.tema.toLowerCase() === storedTheme.toLowerCase());

  if (storedTheme && themeIndex !== -1) {
    theme = storedTheme;
    boje = sveBoje[themeIndex].boje;
  } else {
    if (sveBoje.length > 0) {
      theme = sveBoje[0].tema;
      boje = sveBoje[0].boje;
      localStorage.setItem('theme', theme);
    }
  }

  changeColor(tbodyElements);
}
//DOHVACANJE MESSAGE
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {


  if (message.coloredTickets !== undefined) {

  }


  if (message.settings) {
    bitniArtikli = message.settings.highlightArticle
    importantArticle()

    highlightArticle(bitniArtikli);

    onOffCollors = message.settings.onOffCollors;
    settings.onOffCollors = onOffCollors
    localStorage.setItem("settings", JSON.stringify(settings))
    location.reload();
    if (onOffCollors) {
      changeColor(document.querySelectorAll("#mainTableRow tbody.zero-progress-ticket"));
    }
  }
  if (message.odabraniRadnik) {
    localStorage.setItem('odabraniRadnik', message.odabraniRadnik);
    const body = document.querySelector("body")
    const kreiranRadnikBox = document.querySelector(".kreiranRadnikBox")
    const bojaInput = document.querySelector(".bojaInput");

    bojaInput.addEventListener('change', function () {

      let odabranaBoja = this.value;
      mojaBoja = odabranaBoja
      localStorage.setItem(`odabranaBoja`, odabranaBoja)
    });


    if (!kreiranRadnikBox) {
      const div = document.createElement("div");
      const p = document.createElement("span");

      div.setAttribute("class", "kreiranRadnikBox")
      div.style.setProperty("position", "fixed");

      div.style.setProperty("bottom", "5rem");
      div.style.setProperty("left", "2rem");
      p.innerHTML = message.odabraniRadnik;

      bojaInput.setAttribute("type", "color"); // Postavljanje tipa na color za odabir boje
      bojaInput.setAttribute("name", message.odabraniRadnik); // Postavljanje imena za svaki odabir boje

      div.appendChild(p)
      div.appendChild(bojaInput)
      body.appendChild(div)



    } else {
      kreiranRadnikBox.querySelector("span").innerHTML = message.odabraniRadnik;
    }




  }

  if (message.themes && settings.onOffCollors) {
    processThemes(message.themes);
  }

  if (message.odabranaTema && settings.onOffCollors) {
    theme = message.odabranaTema;
    const selectedTheme = sveBoje.find(item => item.tema.toLowerCase() === theme.toLowerCase());
    if (selectedTheme) {
      boje = selectedTheme.boje;
      localStorage.setItem('theme', message.odabranaTema);
      Object.keys(orderIdColorMap).forEach(key => delete orderIdColorMap[key]);
      changeColor(document.querySelectorAll("#mainTableRow tbody.zero-progress-ticket"));
    }
  }
  if (message.popisArtikala) {
    allTicketItems = message.popisArtikala;
  }
});


tabContent.addEventListener('click', function (e) {
  // Provjeravamo je li kliknuti element unutar tbody s klasom ticket
  var ticketElement = e.target.closest('tbody.ticket');
  if (ticketElement) {
    // Ako je kliknuti element ili njegov roditeljski element unutar tbody s klasom ticket, dohvatimo atribute tog tbody elementa
    var ticketNumber = ticketElement.getAttribute("ticketnumber");
    var ticketId = ticketElement.getAttribute("ticketid");


    chrome.runtime.sendMessage({ action: "fetchActiveTickets" }, function (response) {
      // Ovdje možete obraditi odgovor ako je potrebno
    });
  }
})


let isGlowing = false;
function createGlowElement(navHeight) {

  glowElement = document.createElement("div")
  glowElement.classList.add("glow")
  glowElement.style.setProperty("width", "50px")
  glowElement.style.setProperty("height", `calc(100% - ${navHeight}px)`);
  glowElement.style.setProperty("position", "fixed")
  glowElement.style.setProperty("right", "0")
  glowElement.style.setProperty("top", "45px")
  glowElement.style.setProperty("border-radius", "5rem 0 0 5rem")
  glowElement.style.setProperty("transform", "translateX(20px)")

  glowElement.style.setProperty("transition", "opacity 0.25s ease-in-out")
  glowElement.style.setProperty("background", " linear-gradient(90deg, rgba(2,0,36,0) 0%, rgba(255,0,0,0.7) 100%)")
  document.body.appendChild(glowElement)
  applyGlowToElement(glowElement);
}


function containsOnlyItems() {
  const tbodyElements = document.querySelectorAll("#mainTableRow tbody.zero-progress-ticket");

  const targetItems = [1593, 1591, 1589, 1590, 1587, 1588, 1594, 1584, 1521, 1524, 1597]; // Item IDs to check for

  let blacklistTickets = [];
  const targetIds = [];

  tbodyElements.forEach((tbody) => {
    const ticketID = tbody.getAttribute("ticketid");
    if (blacklistTickets.includes(ticketID)) return;

    const ticketItems = tbody.querySelectorAll(".ticket-item");
    const itemIds = Array.from(ticketItems).map((item) => parseInt(item.getAttribute("product-id")));
    const containsOnly = itemIds.every((itemId) => targetItems.includes(itemId));

    if (containsOnly) {
      targetIds.push(ticketID);
      isGlowing = true;
    } else {
      blacklistTickets.push(ticketID);
      isGlowing = false;
    }
  });

  tbodyElements.forEach((tbody) => {
    const ticketID = tbody.getAttribute("ticketid");
    if (targetIds.includes(ticketID)) {
      tbody.style.boxShadow = "0 0 5px 5px  red";
      notificirajElementi.push(tbody);
    }
  });
}





let blinkInterval;
function applyGlowToElement() {


  // Funkcija koja mijenja boju outline-a kako bi blinkao
  function toggleOutline() {
    if (isGlowing) {

      const currentOpacity = glowElement.style.opacity
      if (currentOpacity === `1`) {
        glowElement.style.opacity = "0";
      } else {
        glowElement.style.opacity = `1`;
      }
    } else glowElement.style.opacity = "0"
  }

  // Pokretanje intervala koji mijenja boju outline-a
  blinkInterval = setInterval(toggleOutline, 500); // Promijenite 500 na željeni interval blinkanja (u milisekundama)




}
let firstLoad = true


function importantArticle() {
  const trs = document.querySelectorAll(".ticket-item")
  let storedHighlightedArticles = undefined
  if (firstLoad) {
    storedHighlightedArticles = JSON.parse(localStorage.getItem("settings")).highlightArticle || [];
  }
  firstLoad = false;
  for (const tr of trs) {
    const productID = tr.getAttribute('product-id');
    if (
      (storedHighlightedArticles && parseInt(storedHighlightedArticles) === parseInt(productID)) ||
      (!storedHighlightedArticles && bitniArtikli.includes(parseInt(productID)))
    ) {
      tr.style.setProperty("background", "red");
    } else {
      tr.style.border = "none";
    }
  }
}

// When an article is highlighted, store its ID in local storage
function highlightArticle(articleID) {
  let storedHighlightedArticles = JSON.parse(localStorage.getItem("highlightedArticles")) || [];
  storedHighlightedArticles = articleID;
  settings.highlightArticle = storedHighlightedArticles;
  localStorage.setItem("settings", JSON.stringify(settings));
}






window.addEventListener("load", () => {
  const storedRadnik = localStorage.getItem("odabraniRadnik")
  const odabranaBoja = localStorage.getItem("odabranaBoja")
  const storedItems = localStorage.getItem('sortedItems');
  const storedTheme = localStorage.getItem('theme');
  const tbodyElements = document.querySelectorAll("#mainTableRow tbody.zero-progress-ticket");


  const nav = document.getElementById("navigacija");
  if (nav) {
    const navHeight = nav.offsetHeight;

    createGlowElement(navHeight)
  } else createGlowElement("45")

  const tbodyArray = Array.from(tbodyElements);
  const ticketNumbers = tbodyArray.map((element) => element.getAttribute("ticketnumber"));
  const ticketNumbersUnique = [...new Set(ticketNumbers)];


  chrome.runtime.sendMessage({ ticketsUIzradi: ticketNumbersUnique }, function (response) {
  });

  if (storedRadnik) {

    odabraniRadnik = storedRadnik;
    const body = document.querySelector("body")
    const bojaInput = document.createElement("input");
    const kreiranRadnikBox = document.createElement("div");
    const p = document.createElement("span")

    p.innerHTML = odabraniRadnik;
    kreiranRadnikBox.setAttribute("class", "kreiranRadnikBox")
    kreiranRadnikBox.style.setProperty("position", "fixed");

    kreiranRadnikBox.style.setProperty("bottom", "5rem");
    kreiranRadnikBox.style.setProperty("left", "2rem");

    bojaInput.setAttribute("type", "color"); // Postavljanje tipa na color za odabir boje
    bojaInput.setAttribute("name", odabraniRadnik); // Postavljanje imena za svaki odabir boje
    bojaInput.setAttribute("class", "bojaInput");
    bojaInput.value = odabranaBoja ? odabranaBoja : "#00ff00"; //Postavljanje zadane vrednosti u inputu

    kreiranRadnikBox.appendChild(p)
    kreiranRadnikBox.appendChild(bojaInput)
    body.appendChild(kreiranRadnikBox)

    bojaInput.addEventListener('change', function () {

      let odabranaBoja = this.value;
      mojaBoja = odabranaBoja
      localStorage.setItem(`odabranaBoja`, odabranaBoja)
    });
  }



  if (storedTheme) {
    theme = storedTheme;
    boje = theme === "neon" ? theme.neon : theme.pastele;
  }

  if (storedItems) {
    const sortedItems = JSON.parse(storedItems);

    chrome.runtime.sendMessage({ allTicketItems: sortedItems }, function (response) {
      // Ovdje možete obraditi odgovor ako je potrebno
    });
  }
  tbodyElements.forEach((tbody) => {
    processTicket(tbody)

  });

  const tabContent = document.querySelector(".tab-content");
  mainTable = document.querySelector("#mainTable");




  mainTable.addEventListener('scroll', function (event) {
    const element = event.target;

    if (element.scrollLeft > 0) {

      isGlowing = false

      notificirajElementi.forEach((element) => {

        const rect = element.getBoundingClientRect();

        // Dohvaćanje koordinata gornjeg lijevog kutka elementa u odnosu na viewport
        const topInView = rect.top + window.scrollY;
        const leftInView = rect.left + window.scrollX;


        // Provjera je li element unutar vidljivog dijela viewporta
        if (topInView >= 0 && leftInView >= 0 && topInView <= window.innerHeight && leftInView <= window.innerWidth) {
          element.style.boxShadow = "0 0 5px 5px  red";
          // Ako je unutar viewporta, postavite crvenu obrubu

        } else {
          // Ako nije unutar viewporta, uklonite crvenu obrubu
          isGlowing = true
        }
      })

    }
  });




  if (tabContent) tabContent.style.setProperty("height", "80vh");
  if (mainTable) mainTable.style.setProperty("height", "100%");

  importantArticle()
  containsOnlyItems(tbodyElements)
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (
          node.nodeType === 1 &&
          node.tagName.toLowerCase() === "tbody" &&
          node.classList.contains("zero-progress-ticket")
        ) {

          const ticketId = node.getAttribute("ticketid");

          let color;

          if (onOffCollors) {
            if (orderIdColorMap[ticketId]) {
              color = orderIdColorMap[ticketId];
            } else {
              color = chooseNextColor();
              orderIdColorMap[ticketId] = color;
            }
            const innerDiv = node.querySelector(".ticket_first_half_completed");
            if (innerDiv) {
              innerDiv.style.backgroundColor = color;
            }

            applyStylingToNewElement(node, color);
          }

          processTicket(node);
          importantArticle()
          containsOnlyItems([node])

          importantArticle()

          node.addEventListener("click", () => {
            const currentlySelected = document.querySelectorAll(".selected-ticket")
            const tbodyElements = document.querySelectorAll("#mainTableRow tbody");

            tbodyElements.forEach((tbody) => {
              if (tbody.classList.contains("selected-ticket")) selectedId = tbody.getAttribute("ticket_id");
              if (!tbody.classList.contains("selected-ticket") && tbody.getAttribute("ticket_id") === selectedId) {
                currentlySelected[0].style.outline = "5px solid red";
              }
              if (!tbody.classList.contains("selected-ticket")) {
                tbody.style.outline = "none";
              } else tbody.style.outline = "5px solid red";
            });
          });
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class"],
  });
});

function applyStylingToNewElement(newElement, selectedColor) {
  const headerRow = newElement.querySelector(
    ".zero-progress-ticket.bg-blue-grey.white-text.text-center.ticket-row-header"
  );
  const lightColor = hexToRgba(selectedColor);
  newElement.style.backgroundColor = lightColor;
  newElement.style.outline = "none";
  newElement.style.borderRadius = "0 0 1rem 1rem";
  newElement.style.borderColor = selectedColor;
  newElement.style.color = "Black";
  newElement.style.boxShadow = `0px 0px 10px ${selectedColor}`;
  if (headerRow) {
    newElement.style.borderRadius = "1rem";
    headerRow.style.setProperty("background-color", selectedColor, "important");
    headerRow.style.setProperty("color", "white", "important");
    const naslov = headerRow.querySelector("span.ticket-title");
    naslov.style.setProperty("padding", "0");
    naslov.style.setProperty("text-shadow", "none");
    const h4 = naslov.parentElement;
    h4.style.setProperty("background", "black");
    h4.style.setProperty("text-align", "center");
    h4.style.borderRadius = "0.75rem 0.75rem 0 0";
    const headerCells = headerRow.querySelectorAll("td");
    headerCells.forEach((cell) => {
      cell.style.setProperty("font-weight", "600", "important");
    });
  }
}