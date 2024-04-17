const supabaseUrl = 'https://xxqeupvmmmxltbtxcgvp.supabase.co/rest/v1';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4cWV1cHZtbW14bHRidHhjZ3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Njk1Nzk3MDYsImV4cCI6MTk4NTE1NTcwNn0.Pump9exBhsc1TbUGqegEsqIXnmsmlUZMVlo2gSHoYDo';

const poslovnica = "CCOE"


async function fetchTheme() {
    const response = await fetch(`${supabaseUrl}/remarisMakeoverThemes`, {
        method: 'GET',
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
        },
    });
    if (!response.ok) {
        throw new Error('Unable to fetch locations from Supabase');
    }
    return await response.json();
}



async function savePopisArtikalaItemsToSupabase(popisArtikala) {
    try {
        const response = await fetch(`${supabaseUrl}/artikliRemaris`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify(popisArtikala.map(item => ({
                naziv_artikla: item.naziv_artikla,
                id_artikla: item.id_artikla
            })))
        });

        if (!response.ok) {
            throw new Error('Unable to save sorted items to Supabase');
        }

        return await response.json();
    } catch (error) {
        throw new Error('Error saving sorted items to Supabase: ' + error.message);
    }
}




async function fetchPopisArtikala() {
    const response = await fetch(`${supabaseUrl}/artikliRemaris`, {
        method: 'GET',
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
        },
    });
    if (!response.ok) {
        throw new Error('Unable to fetch popisArtikala from Supabase');
    }
    const responseData = await response.json(); // Pokušaj parsiranja JSON-a
    console.log("Supa popis artikla: ", responseData)
    return responseData; // Vrati parsirane podatke
}


async function removeExistingArikles(sviArtikli) {
    const stariArtikli = await fetchPopisArtikala();

    console.log("svi", sviArtikli)
    console.log("stari", stariArtikli)
    const noviArtikli = sviArtikli.filter((artikl) => !stariArtikli.some((sa) => sa.id_artikla === artikl.id_artikla))

    console.log("novi", noviArtikli)
    savePopisArtikalaItemsToSupabase(noviArtikli)

}
fetchTheme()
fetchPopisArtikala()
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
        // Provjerite je li tab u kojem je stranica učitana aktivan
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs.length > 0 && tabs[0].id === tabId) {
                // Ako je tab aktivan, pošaljite poruku u content skript
                fetchTheme()
                    .then(data => {
                        console.log(data);
                        chrome.tabs.sendMessage(tabId, { themes: data });
                    })
                    .catch(error => {
                        console.error('Greška pri dohvaćanju podataka o temama:', error);
                    });
                fetchPopisArtikala()
                    .then(popisArtikala => {
                        console.log("Poslao artikle");

                        chrome.storage.local.set({ popisArtikala: popisArtikala })
                    })
                    .catch(error => {
                        console.error('Greška pri dohvaćanju podataka o popisArtikala:', error);
                    });
            }
        });
    }
});


async function sendActiveTickets(tickets) {
    try {
        const response = await fetch(`${supabaseUrl}/remarisNarudzbe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify(tickets.map(ticket => ({
                broj_narudzbe: ticket,
                poslovnica: poslovnica
            })))
        });

        if (!response.ok) {
            console.log(response)
            throw new Error('Unable to send current tickets to supa');
        }

        const responseData = await response.json();
        return responseData;
    } catch (error) {
        console.error('Greška prilikom slanja trenutnih karata u Supabazu:', error);
        throw error;
    }
}

async function fetchActiveTickets() {

    const response = await fetch(`${supabaseUrl}/remarisNarudzbe?poslovnica=eq.${poslovnica}`, {
        method: 'GET',
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
        }
    });

    if (!response.ok) {
        throw new Error('Unable to fetch popisArtikala from Supabase');
    }
    const responseData = await response.json(); // Pokušaj parsiranja JSON-a
    console.log("Supa popis trenutnih narudzbi: ", responseData)
    return responseData; // Vrati parsirane podatke

}



chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");
    console.log(message);

    if (message.action === "fetchActiveTickets") {
        try {
            const responseData = await fetchActiveTickets();
            console.log("Odgovor od background skripte:", JSON.stringify(responseData));
            sendResponse(JSON.stringify(responseData));
            return true;
        } catch (error) {
            sendResponse({ error: error.message });
        }
        return true; // Ovo osigurava da se zadrži otvoren kanal za poruke
    }


    if (message.ticketsUIzradi) {
        const trenutneNarudzbeUSupa = await fetchActiveTickets();
        const trenutneNarudzbeNaEkranu = message.ticketsUIzradi;

        const noveNarudzbe = trenutneNarudzbeNaEkranu.filter(narudzba => {
            return !trenutneNarudzbeUSupa.some(n => parseInt(n.broj_narudzbe) === parseInt(narudzba));
        });
        console.log("Nove narudžbe", noveNarudzbe);

        sendActiveTickets(noveNarudzbe)
            .then(() => {
                sendResponse({ success: true });
            })
            .catch(error => {
                console.error('Greška pri spremanju sortiranih stavki na Supabase:', error);
                sendResponse({ success: false });
            });
        return true;
    }

    if (message.popisArtikala) {
        const popisArtikala = message.popisArtikala;
        removeExistingArikles(popisArtikala)
            .then(() => {
                sendResponse({ success: true });
            })
            .catch(error => {
                console.error('Greška pri spremanju sortiranih stavki na Supabase:', error);
                sendResponse({ success: false });
            });
        return true;
    }
});


