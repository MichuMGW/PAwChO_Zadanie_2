const express = require("express");
const axios = require("axios");

const app = express();
const PORT = 3000;
const AUTHOR = "Michał Filipczak";

const countries = {
  Polska: ["Lublin", "Warszawa"],
  Niemcy: ["Berlin", "Monachium"],
  Czechy: ["Praga", "Brno"]
};

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  let html = `<h1>Wybierz lokalizację</h1>
  <form method="POST" action="/weather">
    <label for="country">Kraj:</label>
    <select name="country" id="country">`;
  for (let country in countries) {
    html += `<option value="${country}">${country}</option>`;
  }
  html += `</select>
    <label for="city">Miasto:</label>
    <select name="city" id="city">`;
  countries["Polska"].forEach((city) => {
    html += `<option value="${city}">${city}</option>`;
  });
  html += `</select>
    <button type="submit">Pokaż pogodę</button>
  </form>
  <script>
    const countries = ${JSON.stringify(countries)};
    document.getElementById('country').addEventListener('change', function() {
      const selected = this.value;
      const citySelect = document.getElementById('city');
      citySelect.innerHTML = '';
      countries[selected].forEach(city => {
        const opt = document.createElement('option');
        opt.value = city;
        opt.textContent = city;
        citySelect.appendChild(opt);
      });
    });
  </script>`;
  res.send(html);
});

app.post("/weather", async (req, res) => {
  const { country, city } = req.body;

  try {
    const response = await axios.get(`https://wttr.in/${city}?format=j1`);
    const weather = response.data;

    const current = weather.current_condition[0];

    res.send(`
      <h1>Pogoda dla: ${city}, ${country}</h1>
      <p>Temperatura: ${current.temp_C}°C</p>
      <p>Opis: ${current.weatherDesc[0].value}</p>
      <p>Wilgotność: ${current.humidity}%</p>
      <p>Wiatr: ${current.windspeedKmph} km/h</p>
      <a href="/">Wróć</a>
    `);
  } catch (error) {
    console.error("Błąd podczas pobierania pogody:", error.message);
    res.send(`<p>Błąd: Nie udało się pobrać pogody dla ${city}, ${country}</p><a href="/">Wróć</a>`);
  }
});

app.listen(PORT, () => {
  const now = new Date().toLocaleString();
  console.log(`Data uruchomienia: ${now}`);
  console.log(`Autor: ${AUTHOR}`);
  console.log(`Aplikacja nasłuchuje na porcie ${PORT}`);
});
