const orderIdColorMap = {};
let currentIndex = 0;
let theme = undefined;
let boje = undefined;
let sveBoje = [];
let mojaBoja = undefined;
let uIzradi = []
let odabraniRadnik = undefined
const poslovnica = "CCOE"
const tabContent = document.querySelector(".tab-content")
const notificirajArtikli = [1424, 1425,1426,1429,1430,1434,1435,1437,1441,1468,1475, 1488, 1491, 1492, 1520, 1521,1524,1581,1582,1583, 1584,1585, 1587, 1588, 1589,1590, 1591,1593,1594,1595, 1597, 1598, 1871, 1872, 1884, 1886, 1887, 1888, 1889, 1890,1891, 1924, 1925,1947, 1948]

const allTicketItems = {};

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
    const boje = JSON.parse(tema.colors);
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

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  
  if (message.odabraniRadnik) {
    localStorage.setItem('odabraniRadnik', message.odabraniRadnik);
    const body = document.querySelector("body")
    const kreiranRadnikBox = document.querySelector(".kreiranRadnikBox")
    const bojaInput = document.querySelector(".bojaInput");

    bojaInput.addEventListener('change', function () {

      let odabranaBoja = this.value;
      console.log(odabranaBoja)
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




    // Spremi odabrani radnik u localStorage
    console.log(message.odabraniRadnik)
  }

  
  if (message.themes) {
    processThemes(message.themes);
  }

  if (message.odabranaTema) {
  console.log(message)
    theme = message.odabranaTema;
    const selectedTheme = sveBoje.find(item => item.tema.toLowerCase() === theme.toLowerCase());
    if (selectedTheme) {
      boje = selectedTheme.boje;
      localStorage.setItem('theme', message.odabranaTema);
      Object.keys(orderIdColorMap).forEach(key => delete orderIdColorMap[key]);
      changeColor(document.querySelectorAll("#mainTableRow tbody.zero-progress-ticket"));
    } else {
      console.log("Odabrana tema nije pronađena.");
    }
  }
  if(message.popisArtikala){
	allTicketItems=message.popisArtikala;
  }
});


tabContent.addEventListener('click', function (e) {
  // Provjeravamo je li kliknuti element unutar tbody s klasom ticket
  var ticketElement = e.target.closest('tbody.ticket');
  if (ticketElement) {
    // Ako je kliknuti element ili njegov roditeljski element unutar tbody s klasom ticket, dohvatimo atribute tog tbody elementa
    var ticketNumber = ticketElement.getAttribute("ticketnumber");
    var ticketId = ticketElement.getAttribute("ticketid");

    // Sada možemo koristiti ove atribute kako želimo, na primjer:
    console.log("Broj karte:", ticketNumber);
    console.log("ID karte:", ticketId);


    chrome.runtime.sendMessage({ action: "fetchActiveTickets" }, function (response) {
      console.log(response)
      console.log("Odgovor od background skripte:", response);
      // Ovdje možete obraditi odgovor ako je potrebno
    });
  }
})


function containsOnlyItems(tbodyElements) {
  const targetItems = [1593, 1591, 1589, 1590, 1587, 1588, 1594, 1584, 1521, 1524, 1597]; // Item IDs to check for
  for (const tbody of tbodyElements) {
    const ticketItems = tbody.querySelectorAll(".ticket-item");
    const itemIds = Array.from(ticketItems).map(item => parseInt(item.getAttribute("product-id")));
    const containsOnly = itemIds.every(itemId => targetItems.includes(itemId));
    if (containsOnly) {
      // Ako narudžba sadrži samo artikle iz liste targetItems, pronađi roditeljski element s ID-om mainTableRow i primijeni stil na njega
      const parentMainTableRow = tbody.closest("#mainTable");
      if (parentMainTableRow) {
        applyGlowToElement(parentMainTableRow);
      }
      return true; // Ako su svi artikli u svakom tbody elementu iz liste targetItems, vraćamo true
    }
  }
  return false; // Ako pronađemo barem jedan artikl koji nije u listi targetItems u bilo kojem tbody elementu, vraćamo false
}

function applyGlowToElement(element) {
    
  let blinkInterval;
let color ="red";
  // Funkcija koja mijenja boju outline-a kako bi blinkao
  function toggleOutline() {
    const currentOutline = element.style.borderRight;
    if (currentOutline === `12px solid ${color}`) {
      element.style.border= "none";
    } else {
      element.style.borderRight = `12px solid ${color}`;
    }
  }

  // Pokretanje intervala koji mijenja boju outline-a
  blinkInterval = setInterval(toggleOutline, 500); // Promijenite 500 na željeni interval blinkanja (u milisekundama)

  // Funkcija za zaustavljanje blinkanja kada se narudžba rijesi
  function stopBlinking() {
    clearInterval(blinkInterval);
    element.style.outline = "none"; // Makni outline
  }

  // Ovdje bi trebali dodati kod koji će se pozvati kada se narudžba riješi
  // Na primjer, ako koristite AJAX za rješavanje narudžbe, možete pozvati stopBlinking() u success callback-u.

  // Povratna funkcija koja se poziva kada se klikne na element
  function handleClick() {
    // Ovdje bi trebali dodati kod za rješavanje narudžbe
    // Na primjer, možete pozvati funkciju koja će obaviti AJAX poziv za rješavanje narudžbe

    // Nakon što se narudžba riješi, zaustavljamo blinkanje
    stopBlinking();
  }

  // Dodavanje event listener-a koji će zaustaviti blinkanje kada se klikne na element
  element.addEventListener("click", handleClick);


}



window.addEventListener("load", () => {
  const storedRadnik = localStorage.getItem("odabraniRadnik")
  const odabranaBoja = localStorage.getItem("odabranaBoja")
  const storedItems = localStorage.getItem('sortedItems');
  const storedTheme = localStorage.getItem('theme');
  const tbodyElements = document.querySelectorAll("#mainTableRow tbody.zero-progress-ticket");



  const tbodyArray = Array.from(tbodyElements);
  const ticketNumbers = tbodyArray.map((element) => element.getAttribute("ticketnumber"));
  const ticketNumbersUnique = [...new Set(ticketNumbers)];


chrome.runtime.sendMessage({ ticketsUIzradi: ticketNumbersUnique }, function (response) {
    console.log("Poruka poslana na stražnji kraj.");
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
      console.log(odabranaBoja)
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
    sortedItems.forEach(item => {
      allTicketItems[item.itemId] = item;
    });
  } else {
    console.log('Podaci nisu pronađeni u lokalnoj pohrani.');
  }

  tbodyElements.forEach((tbody) => {
    processTicket(tbody);
  });

  const tabContent = document.querySelector(".tab-content");
  const mainTable = document.querySelector("#mainTable");

  if (tabContent) tabContent.style.setProperty("height", "80vh");
  if (mainTable) mainTable.style.setProperty("height", "100%");

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (
          node.nodeType === 1 &&
          node.tagName.toLowerCase() === "tbody" &&
          node.classList.contains("zero-progress-ticket")
        ) {
          if (mainTable) mainTable.style.setProperty("height", "100%");
          tabContent.style.setProperty("height", "90vh");
          const ticketId = node.getAttribute("ticketid");
          let color;
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
          processTicket(node);
          if (containsOnlyItems([node])) {
          console.log("Narudžba sadrži sve artikle.");
        } else {
          console.log("Narudžba ne sadrži sve artikle.");
        }
          node.addEventListener("click", () => {
              console.log("CLICK")
            const currentlySelected = document.querySelectorAll(".selected-ticket")
            const tbodyElements = document.querySelectorAll("#mainTableRow tbody");
console.log(currentlySelected)
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
