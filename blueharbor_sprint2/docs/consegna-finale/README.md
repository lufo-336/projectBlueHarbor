# Consegna finale — BlueHarbor Terminal

I documenti conclusivi della commessa MSC (Learning by Project, ITS WSA 2025-2027).

| File | Cos'è |
|---|---|
| `BlueHarbor_Presentazione_Finale.pptx` | La presentazione da proiettare — 8 slide, 16:9 |
| `BlueHarbor_Presentazione_Finale.pdf` | Stessa presentazione in PDF: copia di sicurezza, se in sala il pptx non si apre |
| `BlueHarbor_Manuale_Utente.pdf` | Manuale d'uso per chi opera al porto — 7 pagine A4, con schermate dell'applicazione |
| `BlueHarbor_Documentazione_Tecnica.pdf` | Documento tecnico per i referenti IT — 8 pagine A4, con schermate |
| `BlueHarbor_Presentazione.pptx` | **Non è un deliverable: è il template.** Lo scheletro originale di Stefano — sequenza slide della commessa, palette navy/oro, Calibri, 16:9. Lo script della presentazione lo apre per ereditarne tema e master. **Non cancellare**, o la build si rompe |

## Come sono fatti

Questi PDF **non si modificano a mano**: sono costruiti da sorgenti che stanno fuori dal repo,
in `documentazione/prodotto/` (cartella locale, gitignorata per scelta del team — "su GitHub
resta solo il progetto"). Chi ha quella cartella trova in `documentazione/consegna_finale/LEGGIMI.md`
il comando esatto per rigenerare ciascun file.

In sintesi:

- **presentazione** — script Python con `python-pptx`, che legge il template qui accanto;
- **manuale e documento tecnico** — Markdown → HTML → PDF con Edge headless, ciascuno con il
  proprio tema di stampa;
- **schermate** — catturate dall'applicazione vera con Playwright, non ritagliate a mano.

## Storia di questa cartella

La prima versione (commit `f25f700`, Stefano) conteneva manuale e documento tecnico in `.docx`
più il relativo PDF. I `.docx` sono stati rimossi quando manuale e documento tecnico sono stati
riscritti a partire da sorgenti Markdown versionati: tenere due sorgenti diverse per lo stesso
documento è il modo più rapido per consegnarne una versione vecchia. **I `.docx` restano
recuperabili dalla storia git** (`git show f25f700 -- <percorso>`).
