// popup.js





document.addEventListener('DOMContentLoaded', function () {
  var refreshButton = document.getElementById('refreshButton');
  refreshButton.addEventListener('click', function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.reload(tabs[0].id);
    });
  });



  // Dodavanje radnika ovisno o odabranom broju
  const brojRadnika = document.querySelector(".brojRadnikaInput")
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

  });




  // Dohvaćanje tema iz lokalne pohrane
  chrome.storage.local.get('themes', function (data) {
    console.log(data)
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
