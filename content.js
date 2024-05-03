
let settings = { onOffCollors: false, highlightArticle: 0 };
let firstLoad = true



settings = getStoredData("settings", settings)


window.addEventListener("load", () => {

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

                    importantArticle()

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

    importantArticle()

    ///ZAVRSETAK TESTNOG DIJELA











})



//DOHVACANJE MESSAGE
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {




    if (message.settings) {
        settings = message.settings
        importantArticle()
        console.log(message)
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
