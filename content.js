
let settings = { onOffCollors: false, highlightArticle: 0 };
const notificirajElementi = []
let isGlowing = false;
let blinkInterval = 500;
const allTicketItems = [];
let allArticles = [];
const orderIdColorMap = {};
let boje = "";
let sveBoje = [];
let currentIndex = 0;
let newColors = [{
    glovo: "FFC244",
    ovdje: "",
    van: "",
}]



settings = getStoredData("settings", settings)



window.addEventListener("load", () => {

    const nav = document.getElementById("navigacija");


    if (nav) {
        const navHeight = nav.offsetHeight;
        createGlowElement(navHeight)
    } else createGlowElement("45")


    //Svaki novi ticket, pali se observer
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (
                    node.nodeType === 1 &&
                    node.tagName.toLowerCase() === "tbody" &&
                    node.classList.contains("zero-progress-ticket")
                ) {
                    //Sve što zelimo napraviti na sa ticketima mora ići ovdje

                    if (settings.onOffCollors && boje !== "") {
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

                    easyToMakeTicketsHighlighter()
                    importantArticle()
                    hideGlowElement()
                    processTicket(node)
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




    ///TESTNI DIO:
    const tbodyElements = document.querySelectorAll("#mainTableRow tbody.zero-progress-ticket");

    easyToMakeTicketsHighlighter()
    importantArticle()
    hideGlowElement()




    tbodyElements.forEach((tbody) => {
        processTicket(tbody)

    });
    ///ZAVRSETAK TESTNOG DIJELA


})



//DOHVACANJE MESSAGE
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    console.log(message)

    if (message.settings) {
        settings = message.settings
        if (settings.onOffCollors && boje !== "") {
            changeColor();
        }
        if (!settings.onOffCollors) {
            setStoredData("theme", "")
            location.reload();
        }
        importantArticle()
        setStoredData("settings", settings)

    }

    if (message.popisArtikala) {
        allArticles.push(message.popisArtikala);
        setStoredData("allArticles", allArticles)
    }
    if (message.odabranaTema && settings.onOffCollors) {
        const selectedTheme = sveBoje.find(item => item.tema.toLowerCase() === message.odabranaTema.toLowerCase());
        if (selectedTheme) {
            boje = selectedTheme.boje;
            setStoredData("theme", message.odabranaTema)
            Object.keys(orderIdColorMap).forEach(key => delete orderIdColorMap[key]);
        }
        changeColor()
        easyToMakeTicketsHighlighter()
    }
    if (message.themes) {
        processThemes(message.themes);

        easyToMakeTicketsHighlighter()
    }
});




function getStoredData(key, dataIfNothingFound) {
    let storedData = JSON.parse(localStorage.getItem(key))
    if (storedData) {
        return storedData
    } else {
        localStorage.setItem(key, JSON.stringify(dataIfNothingFound))
        return dataIfNothingFound
    }
}
function setStoredData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

//Highlight important article in tickets
function importantArticle() {
    const trs = document.querySelectorAll(".ticket-item")

    for (const tr of trs) {

        const productID = tr.getAttribute('product-id');

        if (
            (parseInt(settings.highlightArticle) === parseInt(productID))
        ) {
            tr.style.background = "rgba(255, 0 ,0 ,0.75)";
        } else {
            tr.style.background = "none";
        }
    }
}


//Highlight easy to make tickets
function easyToMakeTicketsHighlighter() {
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

//Creation of notification element 
function createGlowElement(navHeight) {

    glowElement = document.createElement("div")
    glowElement.classList.add("glow")
    glowElement.style.setProperty("width", "50px")
    glowElement.style.setProperty("height", `calc(100% - ${navHeight}px)`);
    glowElement.style.setProperty("position", "fixed")
    glowElement.style.setProperty("right", "0")
    glowElement.style.setProperty("top", "45px")
    glowElement.style.setProperty("border-radius", "5rem 0 0 5rem")
    glowElement.style.setProperty("transform", "translateX(10px)")

    glowElement.style.setProperty("transition", "opacity 0.25s ease-in-out")
    glowElement.style.setProperty("background", " linear-gradient(90deg, rgba(2,0,36,0) 0%, rgba(255,0,0,0.7) 100%)")
    document.body.appendChild(glowElement)
    applyGlowToElement(glowElement);
}


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
    setInterval(toggleOutline, blinkInterval);




}


//Hide glowElement if simple ticket is in viewport
function hideGlowElement() {
    const mainTable = document.querySelector("#mainTable");
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

                } else {
                    // Ako nije unutar viewporta, uklonite crvenu obrubu
                    isGlowing = true
                }
            })

        }
    });

}



//Processing every ticketItem and saving it for future referance
function processTicket(tbody) {
    const ticketItems = tbody.querySelectorAll(".ticket-item");

    ticketItems.forEach(item => {
        const itemName = item.querySelector("dt").innerText.trim();
        const itemId = parseInt(item.getAttribute("product-id"));


        allTicketItems.push({ itemName, itemId });
    });

    const sortedItems = Object.values(allTicketItems).sort((a, b) => a.itemId - b.itemId);

    setStoredData("allTicketArticles", sortedItems)

    chrome.runtime.sendMessage({ allTicketItems: sortedItems });
}



//Customazing tickets
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



function chooseNextColor() {

    const colorCount = boje.length;
    if (currentIndex >= colorCount) {
        currentIndex = 0;
    }
    const nextColor = boje[currentIndex];
    currentIndex++;
    return nextColor;
}


function changeColor() {
    const tbodyElements = document.querySelectorAll("#mainTableRow tbody.zero-progress-ticket")



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
    themes.forEach((tema) => {
        const temaNaziv = tema.theme;
        boje = JSON.parse(tema.colors);
        sveBoje.push({ tema: temaNaziv, boje: boje });
    });
    setInitialTheme()
}


function setInitialTheme() {
    const storedTheme = getStoredData('theme', "");
    if (!storedTheme) return

    let themeIndex = sveBoje.findIndex(item => item.tema.toLowerCase() === storedTheme.toLowerCase());

    if (storedTheme && themeIndex !== -1) {
        theme = storedTheme;
        boje = sveBoje[themeIndex].boje;
    } else {
        if (sveBoje.length > 0) {
            theme = sveBoje[0].tema;
            boje = sveBoje[0].boje;
            setStoredData('theme', theme);
        }
    }
    changeColor()

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