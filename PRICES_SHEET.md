# Kainų valdymas per Google Sheets

Svetainė kainas pasiima tiesiai iš Google lentelės. Kai pakeičiate kainą lentelėje
ir išsaugote, svetainė atsinaujina automatiškai (per kelias minutes – Google šiek
tiek talpina duomenis). Jokio kodo keisti nereikia.

Jei lentelės nepavyksta pasiekti, svetainė rodo numatytąsias (atsargines) kainas,
todėl niekada „nenukrenta“.

---

## 1. Sukurkite lentelę

Sukurkite naują Google lentelę. Pirmame lape (tab) pavadinkite jį **`Kainos`**
(arba pakeiskite `SHEET_NAME` faile `script.js`).

Pirma eilutė – stulpelių antraštės (būtinai šie pavadinimai):

| kodas | pavadinimas                  | kiekis | kaina | populiarus |
|-------|------------------------------|--------|-------|------------|
| DK    | Dyzelinas kuras (DK)         | 1000   | 1.96  |            |
| DK    | Dyzelinas kuras (DK)         | 1250   | 1.96  |            |
| DK    | Dyzelinas kuras (DK)         | 1500   | 1.96  |            |
| DK    | Dyzelinas kuras (DK)         | 1750   | 1.96  |            |
| DK    | Dyzelinas kuras (DK)         | 2000   | 1.96  |            |
| DK    | Dyzelinas kuras (DK)         | 2500   | 1.96  |            |
| DK    | Dyzelinas kuras (DK)         | 3000   | 1.95  | x          |
| DK    | Dyzelinas kuras (DK)         | 4000   | 1.95  |            |
| DK    | Dyzelinas kuras (DK)         | 5000   | 1.95  |            |
| DKK   | Dyzelino kuras Žiemos (DKK)  | 1000   | 2.05  |            |
| DKK   | Dyzelino kuras Žiemos (DKK)  | 3000   | 2.00  | x          |
| DKU   | Dyzelino kuras vasaros (DKU) | 1000   | 1.92  |            |
| DKU   | Dyzelino kuras vasaros (DKU) | 3000   | 1.90  | x          |

### Stulpelių reikšmės
- **kodas** – kuro kodas: `DK`, `DKK` arba `DKU` (privaloma).
- **pavadinimas** – kaip rodoma svetainėje (galima keisti).
- **kiekis** – litrai (sveikas skaičius).
- **kaina** – kaina už 1 litrą eurais. Galima rašyti `1.95` arba `1,95`.
- **populiarus** – įrašykite `x` (arba `taip`) prie eilutės, kurią norite pažymėti
  „Populiariausias“. Palikite tuščią kitur.

> Pastaba: kiekvienas kuras gali turėti SKIRTINGUS kiekius. Tiesiog pridėkite ar
> pašalinkite eilutes – svetainės lentelė atitinkamai pasikeis.

---

## 2. Padarykite lentelę viešai skaitomą

1. Viršuje dešinėje spauskite **Share** (Bendrinti).
2. Dalyje „General access" pasirinkite **Anyone with the link**.
3. Rolę palikite **Viewer** (Skaitytojas).
4. **Done.**

(Niekas negalės redaguoti – tik matyti. Redaguoti galėsite tik jūs.)

---

## 3. Įrašykite lentelės ID į svetainę

Lentelės ID yra jos nuorodoje:

```
https://docs.google.com/spreadsheets/d/  1AbCdEfGh...XyZ  /edit
                                          ^^^^^^^^^^^^^^^^
                                          tai yra ID
```

Faile [`script.js`](script.js), pačioje viršuje, pakeiskite:

```js
const SHEET_ID = 'YOUR_SHEET_ID';   // <- įklijuokite ID čia
const SHEET_NAME = 'Kainos';        // <- lapo pavadinimas
```

Išsaugokite, įkelkite į Hostinger (arba `git push` + redeploy). Viskas – nuo šiol
kainas valdote tik per lentelę.

---

## Dažni klausimai

**Kainos neatsinaujina iškart?** Google talpina duomenis kelioms minutėms.
Palaukite 2–5 min. ir perkraukite puslapį.

**Įrašiau blogą kainą / lentelė neprieinama?** Svetainė automatiškai rodys
numatytąsias kainas iš `script.js`, todėl kainų skiltis niekada nedings.

**Noriu pridėti naują kiekį (pvz. 6000 L)?** Pridėkite naują eilutę su tuo kiekiu
ir kaina – atsiras automatiškai.
