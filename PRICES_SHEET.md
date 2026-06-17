# Kainų valdymas per Google Sheets

Svetainė kainas pasiima tiesiai iš jūsų Google lentelės. Kai pakeičiate kainą ir
išsaugote, svetainė atsinaujina automatiškai (per kelias minutes – Google šiek tiek
talpina duomenis). Jokio kodo keisti nereikia.

Jei lentelės nepavyksta pasiekti, svetainė rodo numatytąsias (atsargines) kainas,
todėl niekada „nenukrenta".

---

## Lentelės formatas

Svetainė skaito jūsų esamą lentelę tokią, kokia ji yra – trys kuro blokai vienas
šalia kito, kiekvienas po 3 stulpelius:

| | A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|---|
| **1** | Dyzelinas kuras | | | Dyzelinas kuras Šildymui | | | Dyzelinas kuras Ūkinikam | | |
| **2** | Kuro kiekis | Kaina 1L | Viso Suma | Kuro kiekis | Kaina 1L | Viso Suma | Kuro kiekis | Kaina 1L | Viso Suma |
| **3** | 500 | 1,96 | =A3*B3 | 500 | 1,47 | … | 500 | 1,39 | … |
| **4** | 1000 | 1,96 | … | 1000 | 1,47 | … | 1000 | 1,39 | … |
| … | … | … | … | … | … | … | … | … | … |

### Ką redaguoti
- **Keičiate kainas** stulpeliuose **B**, **E**, **H** („Kaina 1L"). Tai vienintelis
  dalykas, kurį reikia keisti kasdien.
- **Kuro kiekis** (A, D, G) – galite pridėti ar pašalinti eilutes; svetainės lentelė
  atitinkamai pasikeis.
- **Viso Suma** (C, F, I) – skaičiuojama automatiškai (`=kiekis*kaina`); svetainė šio
  stulpelio nenaudoja, sumą perskaičiuoja pati.
- Kiekis **3000 L** automatiškai pažymimas „Populiariausias".

> ⚠️ **Nekeiskite stulpelių tvarkos ir nepridėkite naujų stulpelių tarp blokų** –
> svetainė kainas randa pagal stulpelio vietą (A/B, D/E, G/H). Eilutes pridėti/šalinti
> galima laisvai.

> Kainą galima rašyti su kableliu (`1,96`) arba tašku (`1.96`) – abu veikia.

---

## 1. Padarykite lentelę viešai skaitomą

1. Viršuje dešinėje spauskite **Share** (Bendrinti).
2. Dalyje „General access" pasirinkite **Anyone with the link**.
3. Rolę palikite **Viewer** (Skaitytojas) – kiti tik matys, redaguoti galėsite tik jūs.
4. **Done.**

---

## 2. Įrašykite lentelės ID į svetainę

Lentelės ID yra jos nuorodoje:

```
https://docs.google.com/spreadsheets/d/  1AbCdEfGh...XyZ  /edit
                                          ^^^^^^^^^^^^^^^^
                                          tai yra ID
```

Faile [`script.js`](script.js), pačioje viršuje, pakeiskite:

```js
const SHEET_ID = 'YOUR_SHEET_ID';   // <- įklijuokite ID čia
const SHEET_NAME = '';              // palikite tuščią, jei kainos pirmame lape (tab)
```

Jei kainų lentelė yra ne pirmame lape, įrašykite to lapo pavadinimą į `SHEET_NAME`.

Išsaugokite, įkelkite į Hostinger (arba `git push` + redeploy). Viskas – nuo šiol
kainas valdote tik per lentelę.

---

## Jei pasikeičia kuro pavadinimai

Kuro pavadinimai („Dyzelinas kuras", „…Šildymui", „…Ūkinikam") svetainėje įrašyti
kode (`SHEET_GROUPS` faile `script.js`), nes jie keičiasi retai. Jei norite pervadinti
kurą – pakeiskite `name` ten arba parašykite man.

---

## Dažni klausimai

**Kainos neatsinaujina iškart?** Google talpina duomenis kelioms minutėms.
Palaukite 2–5 min. ir perkraukite puslapį.

**Įrašiau blogą kainą / lentelė neprieinama?** Svetainė automatiškai rodys
numatytąsias kainas iš `script.js`, todėl kainų skiltis niekada nedings.

**Noriu pridėti naują kiekį (pvz. 6000 L)?** Pridėkite naują eilutę su tuo kiekiu ir
kaina kiekviename bloke – atsiras automatiškai.
