// popup.js

var select = document.getElementById("highlightArtikl");
const colorCheckbox = document.getElementById("colorCheckbox")
let settings = {};



document.addEventListener('DOMContentLoaded', function () {

  // Funkcija za postavljanje početnih vrijednosti
  function setInitialValues() {
    let oldSettings = localStorage.getItem("settings");
    console.log(oldSettings);
    if (oldSettings) {
      settings = JSON.parse(oldSettings);
      select.value = settings.highlightArticle;
      colorCheckbox.checked = settings.onOffCollors;
    } else {
      settings = { onOffCollors: false, highlightArticle: 0 };
    }
  }



  // Pozovi funkciju za postavljanje početnih vrijednosti
  setInitialValues();


  // Funkcija za osvježavanje taba
  function refreshTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.reload(tabs[0].id);
    });
  }





  // Dodavanje event listenera za osvježavanje taba
  /*  var refreshButton = document.getElementById('refreshButton');
   refreshButton.addEventListener('click', refreshTab); */

  // Dodavanje event listenera za promjenu checkboxa
  colorCheckbox.addEventListener("change", function () {
    settings.onOffCollors = colorCheckbox.checked;
    saveSettings();
  });

  // Dodavanje event listenera za promjenu select polja
  select.addEventListener("change", function () {
    settings.highlightArticle = select.value;
    saveSettings();
  });


  // Funkcija za spremanje postavki u lokalnu pohranu
  function saveSettings() {
    localStorage.setItem("settings", JSON.stringify(settings));
    chrome.storage.local.set({ "settings": settings });
  }





  // Dodavanje radnika ovisno o odabranom broju
  /*  const brojRadnika = document.querySelector(".brojRadnikaInput")
   const odabirRadnikaContainer = document.querySelector(".odabirRadnikaContainer")
 
   function generirajRadnikeButton() {
     odabirRadnikaContainer.innerHTML = '';
     for (let i = 0; i < brojRadnika.value; i++) {
       const button = document.createElement("button");
       button.textContent = `Radnik ${i + 1}`;
       odabirRadnikaContainer.appendChild(button);
 
       button.addEventListener("click", function () {
         const odabraniRadnik = `Radnik ${i + 1}`;
         chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
           chrome.tabs.sendMessage(tabs[0].id, { odabraniRadnik: odabraniRadnik });
         });
 
         // Spremi odabrani radnik u localStorage
         localStorage.setItem('odabraniRadnik', odabraniRadnik);
       })
     }
   }
 
 
   generirajRadnikeButton()
 
 
 
 
 
   brojRadnika.addEventListener("change", function () {
     // Ukloni sve prethodne elemente prije dodavanja novih
 
     generirajRadnikeButton()
 
   }); */



  chrome.storage.local.get('popisArtikala', function (data) {
    if (!data.popisArtikala) return;

    let popisArtikala = data.popisArtikala.sort((a, b) => {
      if (a.naziv_artikla < b.naziv_artikla) {
        return -1;
      }
      if (a.naziv_artikla > b.naziv_artikla) {
        return 1;
      }
      return 0;
    });

    fillSelectWithPopisArtikala(popisArtikala)
  })


  // Dodavanje artikla u select popup.html
  function fillSelectWithPopisArtikala(artikli) {

    for (let i in artikli) {
      let option = document.createElement("option")
      let optionValue = parseInt(i) + 1; // Zbrajanje 1 s indeksom i pretvaranje u broj
      let optionText = `[${optionValue < 10 ? '0' + optionValue : optionValue}] - ` + artikli[i].naziv_artikla; // Provjera i dodavanje nule ako je potrebno
      option.value = artikli[i].id_artikla;
      option.text = optionText;
      select.appendChild(option);
    }
  }



  // Dohvaćanje tema iz lokalne pohrane
  chrome.storage.local.get('themes', function (data) {
    console.log(data.themes)
    const themes = data.themes;
    if (themes && themes.length > 0) {
      // Generiranje gumba za svaku temu
      const themeButtonsDiv = document.querySelector('.themeButtons');
      themes.forEach(theme => {
        const button = document.createElement('button');
        button.textContent = theme.theme; // Pretpostavljajući da svaka tema ima svoje ime
        button.addEventListener('click', function () {
          // Slanje odabrane teme na content.js
          console.log('Button clicked');
          chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { odabranaTema: theme.theme });
          });
        });
        themeButtonsDiv.appendChild(button);
      });
    } else {
      console.log('Nema dostupnih tema.');
    }
  });


});
console.log(settings)