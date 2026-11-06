# QR Code Generator

A one-page website that turns text or a link into a QR code you can download as a PNG. The code is created in your browser, so what you enter is never sent to a server.

## Features

- Works with any language and with emoji (UTF-8)
- Optional name in the center of the code, shown on the image only
- Starter templates for a website, Wi-Fi network, email address and phone number
- Live byte counter, with clear messages for empty or too-long content
- PNG download at 640 × 640 pixels
- Light and dark themes: follows your system setting until you use the theme button, then remembers your choice
- Responsive layout for phones, tablets and desktops, with large buttons for touch screens

## Run it

Double-click `QRgenerator.html` to open it in your browser. There is nothing to install or build, but you need an internet connection because the QR library and fonts load from the web.

To see an edit, save the file and refresh the browser tab.

## How the project is organized

Everything is in `QRgenerator.html`, which has three parts:

| Part | Where to find it | What it controls |
|---|---|---|
| Styles | `<style>` near the top | Colors, fonts, spacing and layout |
| Content | `<body>` in the middle | All the text you see on the page |
| Script | The last `<script>` at the bottom | How the code is generated, plus the settings and templates |

## Make your own changes

### Change the colors

Edit the values at the top of the `<style>` block:

| Name | Used for |
|---|---|
| `--bg` | Page background |
| `--surface` | QR code panel and text box |
| `--ink` | Main text |
| `--muted` | Secondary text |
| `--line` | Borders and dividers |
| `--accent` | Buttons and links |
| `--on-accent` | Text on buttons |
| `--scan` | Line that sweeps over a new code |
| `--error` | Error messages |

The dark theme has its own copy of these colors. It appears **twice**, right below the light colors, so change both copies.

### Change the fonts

1. Choose fonts on [Google Fonts](https://fonts.google.com) and copy the stylesheet link it gives you.
2. Replace the `fonts.googleapis.com/css2` link in the `<head>`.
3. Put the new font names in `--font-display`, `--font-body` and `--font-mono` at the top of the `<style>` block.

### Change the text

Search for the words you want to change and edit them in the `<body>`:

- **Headline and intro:** the `<h1>` and `<p class="lead">`
- **How it works:** the `<ol class="steps">` list
- **Tips:** the `<ul>` list under "Tips for a code that scans"
- **Footer:** the `<footer>`

The browser tab title and the search description are the `<title>` and `<meta name="description">` in the `<head>`.

### Change the example link

The page shows a code when it first opens. To change its content, edit `value="..."` on the `<input id="content">` line.

### Add a template button

1. Add a button next to the others in the `<body>`:

   ```html
   <button type="button" class="chip" data-template="sms">SMS</button>
   ```

2. Add a matching entry to `TEMPLATES` in the script, using the same name as `data-template`:

   ```js
   sms: {
       value: 'SMSTO:+911234567890:Hello',
       hint: 'Replace the number and the message.'
   },
   ```

### Change the QR code settings

These are under `Settings` at the top of the script:

| Setting | Meaning |
|---|---|
| `QR_SIZE` | Width and height of the PNG, in pixels |
| `QR_MARGIN` | White border around the code, in pixels. Keep it about 10% of `QR_SIZE` |
| `QR_LEVEL` | Error correction when there's no name: `L`, `M`, `Q` or `H`. Higher levels survive more damage but hold less |
| `QR_LEVEL_WITH_NAME` | Error correction when there is a name. Keep this at `H` |
| `MAX_BYTES` | Content limit for each level. The page picks the right one automatically, so you shouldn't need to change these |
| `NAME_FONT_SIZE` | Largest size of the name, in pixels on the PNG. Long names shrink to fit |
| `NAME_MAX_WIDTH` | Widest the name's box can be, as a share of the code (`0.5` is half) |

### Change the name in the center

The white box hides part of the code, and the code still scans because error correction rebuilds the hidden part. That's why a name switches the code to level `H`, which lowers the content limit to 1,273 bytes.

- **Size:** a bigger box hides more of the code, so test with a phone if you raise `NAME_FONT_SIZE` or `NAME_MAX_WIDTH`.
- **Length:** the `maxlength="20"` on the `<input id="center-name">` line sets the longest name allowed.
- **Look:** the box and text are drawn in the `drawCenterName` function in the script.

### Change the theme button

The button is in the `<header>` and the code that runs it is under `Dark theme button` in the script. The choice is saved in the browser under the name `qr-theme`.

### Change the layout on small screens

The layout rules are at the end of the `<style>` block:

- **`max-width: 800px`:** tablets and phones, where the form and the QR code stack into one column
- **`max-width: 520px`:** phones, where the buttons become full width

### Update the QR library

The page loads [QRious](https://github.com/neocotic/qrious) 4.0.2 from a CDN, and the `integrity` attribute on that `<script>` tag makes the browser reject any other file. If you change the version, copy the new `integrity` value from [cdnjs](https://cdnjs.com/libraries/qrious) too, or the library won't load.

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
https://himanshupharswan.github.io/QR-CodeGenerator/QRgenerator.html
```

To use the shorter address without the file name, rename `QRgenerator.html` to `index.html`.
