# Tread Notes

A field guide for everyday U.S. drivers. Choose what you notice about a tire to get a next step and a call note for the shop. There are also pressure and tread exercises, a sidewall decoder, a buyer’s guide, and a printable glove box card.

## Open it on your computer

Download the repository ZIP, extract the folder, and open `index.html` in a browser. Keep the files and the `assets` folder together. The guide, images, fonts, decoder, and practice tools work offline. External source links need internet access.

For a local server on Windows, open PowerShell in the folder that contains `index.html` and run the command below. On macOS or Linux, use `python3` in place of `py`.

```powershell
py -m http.server 8080 --bind 127.0.0.1
```

Open <http://localhost:8080>. Press Ctrl+C in the terminal to stop the server.

## Where to edit

| File | What it controls |
| --- | --- |
| `index.html` | Page structure, buyer’s guide, roadside help, lessons, car card, and source links |
| `cases.js` | Concern choices, urgency levels, driver actions, shop call scripts, and supporting sources |
| `app.js` | Navigation, practice exercises, decoder, clipboard, and print behavior |
| `style.css` | Screen layouts, mobile styling, and print styles |
| `assets/` | Photos, icon, local fonts, and the font license |
| `checks/verify.cjs` | Checks for triage, pressure units, arithmetic, tire ratings, and date-code edge cases |

These are the editable source files the browser runs. There is no build step or package installation. Entries in the car card and the call note stay in the tab. The original app files and assets match the initial hosted release at source commit `890fab613ce5c545b1141b166719e80c91c961e5`.

## Run the checks

With Node.js installed, run this from the folder containing `index.html`.

```sh
node checks/verify.cjs
```

After changing a safety instruction, check its source, the action shown to the driver, and the related result in the shop tool. Check numerical examples two ways. A tire professional’s review and a novice-driver pilot are still pending.

## Host it independently

Any static web host can serve the folder containing `index.html`. For GitHub Pages, after merging the import, choose **Settings → Pages → Deploy from a branch → main → / (root)** and save. This is a separate deployment from the original private ChatGPT-hosted site. A GitHub push alone does not configure hosting.

[GitHub Pages publishing instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
