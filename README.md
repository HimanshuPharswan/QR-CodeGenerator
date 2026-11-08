# QR Code Generator

A one-page website that turns text or a link into a QR code you can download as a PNG. The code is created in your browser, so what you enter is never sent to a server.

## Features

- Works with any language and with emoji (UTF-8)
- Optional name in the center of the code, shown on the image only
- Starter templates for a website, email address and phone number
- Wi-Fi template with its own fields, which handles special characters for you
- Live byte counter, with clear messages for empty, unfinished or too-long content
- Notice when the fields no longer match the code on screen, and a warning for content that may be hard to scan
- PNG download at 640 × 640 pixels
- Light and dark themes: follows your system setting until you use the theme button, then remembers your choice
- Responsive layout for phones, tablets and desktops, with large buttons for touch screens

## Run it

Double-click `index.html` to open it in your browser. There is nothing to install or build, but you need an internet connection because the QR library and fonts load from the web. JavaScript must be turned on, and the page shows a message if it isn't.

To see an edit, save the file and refresh the browser tab.

## How the project is organized

| File | What it controls |
|---|---|
| `index.html` | The page structure and all the text you see |
| `style.css` | Colors, fonts, spacing and layout |
| `script.js` | How the code is generated, plus the settings, templates and theme button |
| `favicon.svg` | The icon in the browser tab |
| `og-image.png` | The preview image shown when the link is shared (1200 × 630 pixels) |
| `LICENSE` | The terms for reusing this code |

Keep these files in the same folder, because `index.html` loads the others from there.

## Make your own changes

### Change the colors

Edit the values at the top of `style.css`:

| Name | Used for |
|---|---|
| `--bg` | Page background |
| `--surface` | QR code panel and text box |
| `--ink` | Main text |
| `--muted` | Secondary text |
| `--line` | Dividers and the QR code panel's border |
| `--control-line` | Borders on the theme and template buttons |
| `--accent` | Buttons and links |
| `--on-accent` | Text on buttons |
| `--scan` | Line that sweeps over a new code |
| `--error` | Error messages |

The dark theme has its own copy of these colors. It appears **twice**, right below the light colors, so change both copies.

### Change the fonts

1. Choose fonts on [Google Fonts](https://fonts.google.com) and copy the stylesheet link it gives you.
2. Replace the `fonts.googleapis.com/css2` link in the `<head>` of `index.html`.
3. Put the new font names in `--font-display`, `--font-body` and `--font-mono` at the top of `style.css`.

### Change the text

Search for the words you want to change and edit them in `index.html`:

- **Headline and intro:** the `<h1>` and `<p class="lead">`
- **How it works:** the `<ol class="steps">` list
- **Tips:** the `<ul>` list under "Tips for a code that scans"
- **Footer:** the `<footer>`

The browser tab title and the search description are the `<title>` and `<meta name="description">` in the `<head>`.

### Change the shared link preview

When the link is shared, apps read the `og:` tags in the `<head>` of `index.html` to build the preview:

- **Text:** edit `og:title` and `og:description`.
- **Image:** replace `og-image.png` with another image of 1200 × 630 pixels.
- **Address:** these tags use the GitHub Pages address. If the site moves, update `og:url` and `og:image`. The image won't appear in previews until the site is online.

### Change the example link

The page shows a code when it first opens. To change its content, edit `value="..."` on the `<input id="content">` line in `index.html`.

### Add a template button

1. Add a button next to the others in `index.html`:

   ```html
   <button type="button" class="chip" data-template="sms">SMS</button>
   ```

2. Add a matching entry to `TEMPLATES` in `script.js`, using the same name as `data-template`:

   ```js
   sms: {
       value: 'SMSTO:+911234567890:Hello',
       hint: 'Replace the number and the message.'
   },
   ```

If someone selects **Generate** without editing a template's `value`, the page asks them to finish it first.

### Change the Wi-Fi template

The Wi-Fi button shows its own **Network name** and **Password** fields in `index.html`. In `script.js`, `buildWifiText` turns them into the text for the code, and `escapeWifiText` handles the characters that have a special meaning in the Wi-Fi format (`\`, `;`, `,`, `"` and `:`). Typing in the main **Text or link** box hides these fields.

### Change the QR code settings

These are under `Settings` at the top of `script.js`:

| Setting | Meaning |
|---|---|
| `QR_SIZE` | Width and height of the PNG, in pixels |
| `QR_MARGIN` | White border around the code, in pixels. Keep it about 10% of `QR_SIZE` |
| `QR_LEVEL` | Error correction when there's no name: `L`, `M`, `Q` or `H`. Higher levels survive more damage but hold less |
| `QR_LEVEL_WITH_NAME` | Error correction when there is a name. Keep this at `H` |
| `MAX_BYTES` | Content limit for each level. The page picks the right one automatically, so you shouldn't need to change these |
| `LONG_CONTENT_BYTES` | Above this size, the page warns that the code may be hard to scan |
| `NAME_FONT_SIZE` | Largest size of a one-line name, in pixels on the PNG. Longer names shrink to fit |
| `NAME_MIN_FONT_SIZE` | If a one-line name would be smaller than this, it's split over two lines instead |
| `NAME_TWO_LINE_FONT_SIZE` | Largest size of a name split over two lines |
| `NAME_MAX_WIDTH` | Widest the name's box can be, as a share of the code (`0.4` is 40%) |
| `DOWNLOAD_FILE_NAME` | File name of the downloaded PNG |
| `EMPTY_STARTS` | Beginnings, such as `mailto:`, that can't be used on their own because the code would do nothing |

### Change the name in the center

The white box hides part of the code, and the code still scans because error correction rebuilds the hidden part. That's why a name switches the code to level `H`, which lowers the content limit to 1,273 bytes.

- **Size:** a bigger box hides more of the code, so test with a phone if you raise `NAME_FONT_SIZE`, `NAME_TWO_LINE_FONT_SIZE` or `NAME_MAX_WIDTH`.
- **Long names:** a name that would be smaller than `NAME_MIN_FONT_SIZE` on one line is split over two lines, at the space nearest the middle when there is one.
- **Length:** the `maxlength="20"` on the `<input id="center-name">` line in `index.html` sets the longest name allowed.
- **Look:** the box and text are drawn in the `drawCenterName` function in `script.js`.

### Change the theme button

- **Button:** it's in the `<header>` of `index.html`, and its style is under `.theme-toggle` in `style.css`.
- **Behavior:** the code is under `Dark theme button` in `script.js`. The choice is saved in the browser under the name `qr-theme`.
- **Saved theme on load:** the small `<script>` in the `<head>` of `index.html` applies the saved choice. It stays there, not in `script.js`, so the wrong theme doesn't flash while the page loads.

### Change the layout on small screens

The layout rules are at the end of `style.css`:

- **`max-width: 800px`:** tablets and phones, where the form and the QR code stack into one column
- **`max-width: 520px`:** phones, where the buttons become full width

### Update the QR library

The page loads [QRious](https://github.com/neocotic/qrious) 4.0.2 from a CDN, and the `integrity` attribute on that `<script>` tag in `index.html` makes the browser reject any other file. If you change the version, copy the new `integrity` value from [cdnjs](https://cdnjs.com/libraries/qrious) too, or the library won't load.

## Test your changes

Before publishing:

1. Generate a code for a link and for some non-English text, such as `नमस्ते`.
2. Generate another with a name in the center.
3. Scan all of them with a phone and check that the text comes through correctly.
4. Select **Download PNG** and open the file.
5. Try the page on a phone, or in a narrow window, in both themes.

Long content makes a dense code that's hard to scan from a screen, especially a phone screen. Download the PNG and display or print it larger.

## Publish your changes

```bash
git add .
git commit -m "Describe your change"
git push
```

To put the page online with GitHub Pages:

1. In the repository on GitHub, go to **Settings > Pages**.
2. Under **Source**, choose **Deploy from a branch**.
3. Choose the `main` branch and the `/ (root)` folder, then select **Save**.

After a minute or two, the page will be at:

```text
https://himanshupharswan.github.io/QR-CodeGenerator/
```

## License

This project is available under the [MIT License](LICENSE).
