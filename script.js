// ===== Settings =====
const QR_SIZE = 640;       // Width and height of the PNG, in pixels
const QR_MARGIN = 64;      // White border around the code, in pixels
const QR_LEVEL = 'M';      // Error correction without a name: L, M, Q or H
const QR_LEVEL_WITH_NAME = 'H';  // Keep this at H. The name hides part of the code,
                                 // and H is the level that can best recover from that.
const MAX_BYTES = { L: 2953, M: 2331, Q: 1663, H: 1273 };  // Content limit for each level

const LONG_CONTENT_BYTES = 300;  // Above this, the page warns that the code may be hard to scan
const NAME_FONT_SIZE = 40;       // Largest size of the name, in pixels on the PNG
const NAME_MAX_WIDTH = 0.4;      // Widest the name's box can be, as a share of the code

// What each starter button puts in the box, and the hint it shows.
// The page won't make a code from a value that hasn't been edited.
const TEMPLATES = {
    website: {
        value: 'https://',
        hint: 'Add the rest of the address after https://'
    },
    wifi: {
        // Wi-Fi uses its own two fields, so its text is built by buildWifiText()
        value: '',
        hint: 'Anyone who sees this code can read the password.'
    },
    email: {
        value: 'mailto:name@example.com',
        hint: 'Replace name@example.com with the email address.'
    },
    phone: {
        value: 'tel:+911234567890',
        hint: 'Replace the number, and include the country code.'
    }
};

// ===== Page elements =====
const form = document.getElementById('qr-form');
const input = document.getElementById('content');
const nameInput = document.getElementById('center-name');
const nameRow = document.getElementById('name-row');
const encodedName = document.getElementById('encoded-name');
const themeToggle = document.getElementById('theme-toggle');
const byteCount = document.getElementById('byte-count');
const hint = document.getElementById('hint');
const longNote = document.getElementById('long-note');
const error = document.getElementById('error');
const statusMessage = document.getElementById('status');
const result = document.getElementById('result');
const canvas = document.getElementById('qr-canvas');
const codeFrame = document.getElementById('code-frame');
const staleNote = document.getElementById('stale-note');
const encodedText = document.getElementById('encoded-text');
const download = document.getElementById('download');
const wifiFields = document.getElementById('wifi-fields');
const wifiName = document.getElementById('wifi-name');
const wifiPassword = document.getElementById('wifi-password');

// What the code on screen currently contains
let drawnValue = '';
let drawnName = '';

// ===== Helpers =====
function toBytes(text) {
    return new TextEncoder().encode(text);
}

// Spaces around the content are removed, because they can stop a phone seeing a link
function contentValue() {
    return input.value.trim();
}

function centerName() {
    return nameInput.value.trim();
}

function currentLevel() {
    return centerName() ? QR_LEVEL_WITH_NAME : QR_LEVEL;
}

function shorten(text) {
    return text.length > 80 ? text.slice(0, 80) + '...' : text;
}

// Keeps the counter, the long-content warning and the out-of-date notice correct
function updateForm() {
    const used = toBytes(contentValue()).length;
    const limit = MAX_BYTES[currentLevel()];
    byteCount.textContent = used.toLocaleString('en-US') + ' / ' + limit.toLocaleString('en-US') + ' bytes';
    byteCount.classList.toggle('over', used > limit);
    longNote.hidden = used <= LONG_CONTENT_BYTES || used > limit;

    const outOfDate = contentValue() !== drawnValue || centerName() !== drawnName;
    result.classList.toggle('out-of-date', outOfDate);
    staleNote.hidden = !outOfDate;
    download.hidden = outOfDate;
}

// Draws the name in a white box over the middle of the finished code
function drawCenterName(name) {
    const context = canvas.getContext('2d');
    const fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--font-body');
    const sidePadding = 14;
    const maxBoxWidth = (QR_SIZE - QR_MARGIN * 2) * NAME_MAX_WIDTH;

    // Measure the name at full size, then shrink it if it wouldn't fit
    context.font = '700 ' + NAME_FONT_SIZE + 'px ' + fontFamily;
    const fullWidth = context.measureText(name).width;
    const fontSize = Math.min(NAME_FONT_SIZE, NAME_FONT_SIZE * (maxBoxWidth - sidePadding * 2) / fullWidth);
    const textWidth = fullWidth * fontSize / NAME_FONT_SIZE;

    const boxWidth = textWidth + sidePadding * 2;
    const boxHeight = fontSize * 1.7;
    const boxLeft = (QR_SIZE - boxWidth) / 2;
    const boxTop = (QR_SIZE - boxHeight) / 2;

    context.fillStyle = '#ffffff';
    context.beginPath();
    if (context.roundRect) {
        context.roundRect(boxLeft, boxTop, boxWidth, boxHeight, 8);
    } else {
        context.rect(boxLeft, boxTop, boxWidth, boxHeight);
    }
    context.fill();

    context.fillStyle = '#000000';
    context.font = '700 ' + fontSize + 'px ' + fontFamily;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(name, QR_SIZE / 2, QR_SIZE / 2);
}

// On phones, closes the keyboard and brings the code into view. With a keyboard
// and a large screen, focus stays put so you can keep typing or Tab to Download.
function showNewCode() {
    const narrow = window.matchMedia('(max-width: 800px)').matches;
    const touch = window.matchMedia('(pointer: coarse)').matches;

    if (narrow || touch) {
        result.focus({ preventScroll: true });
    }
    if (narrow) {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        result.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
}

// ===== Dark theme button =====
function isDarkTheme() {
    const chosen = document.documentElement.getAttribute('data-theme');
    if (chosen) {
        return chosen === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function updateThemeButton() {
    const dark = isDarkTheme();
    document.getElementById('theme-label').textContent = dark ? 'Light' : 'Dark';
    document.getElementById('icon-moon').toggleAttribute('hidden', dark);
    document.getElementById('icon-sun').toggleAttribute('hidden', !dark);
    themeToggle.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
}

themeToggle.addEventListener('click', function () {
    const nextTheme = isDarkTheme() ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    try {
        localStorage.setItem('qr-theme', nextTheme);
    } catch (storageError) {
        // The choice still applies until the page is closed.
    }
    updateThemeButton();
});

// Keeps the button correct if the system theme changes while the page is open
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateThemeButton);

function showError(message) {
    error.textContent = message;
    error.hidden = false;
    result.hidden = true;
}

function playScanLine() {
    codeFrame.classList.remove('scanning');
    void codeFrame.offsetWidth; // Restarts the animation
    codeFrame.classList.add('scanning');
}

// ===== Wi-Fi template =====
// These characters have a special meaning in the Wi-Fi format, so they need a \ before them
function escapeWifiText(text) {
    return text.replace(/([\\;,":])/g, '\\$1');
}

function buildWifiText() {
    if (!wifiName.value) {
        return '';
    }
    const network = 'S:' + escapeWifiText(wifiName.value) + ';';
    return wifiPassword.value
        ? 'WIFI:T:WPA;' + network + 'P:' + escapeWifiText(wifiPassword.value) + ';;'
        : 'WIFI:T:nopass;' + network + ';';
}

function updateFromWifiFields() {
    input.value = buildWifiText();
    updateForm();
}

// ===== Generate the code =====
function generate(animate) {
    const value = contentValue();
    const name = centerName();
    const level = currentLevel();
    const limit = MAX_BYTES[level];

    if (!value) {
        if (wifiFields.hidden) {
            showError('Enter some text or a link first.');
            input.focus();
        } else {
            showError('Enter the Wi-Fi network name first.');
            wifiName.focus();
        }
        return;
    }

    const unfinished = Object.values(TEMPLATES).find(function (template) {
        return template.value === value;
    });
    if (unfinished) {
        showError('Finish the template first. ' + unfinished.hint);
        input.focus();
        return;
    }

    if (typeof QRious === 'undefined') {
        showError('The QR code library could not load. Check your connection and reload the page.');
        return;
    }

    const bytes = toBytes(value);
    if (bytes.length > limit) {
        const limitText = limit.toLocaleString('en-US');
        showError(name
            ? 'With a name in the center, the limit is ' + limitText + ' bytes. Shorten the content or remove the name.'
            : 'That is too long for a QR code. Shorten it to ' + limitText + ' bytes or fewer.');
        return;
    }

    // QRious reads one byte per character, so pass it UTF-8 bytes. Otherwise
    // anything outside Latin-1 (Hindi, emoji, and so on) scans as garbage.
    new QRious({
        element: canvas,
        value: String.fromCharCode.apply(null, bytes),
        size: QR_SIZE,
        padding: QR_MARGIN,
        level: level
    });

    if (name) {
        drawCenterName(name);
    }

    drawnValue = value;
    drawnName = name;
    download.href = canvas.toDataURL('image/png');
    canvas.setAttribute('aria-label', 'QR code for: ' + shorten(value));
    encodedText.textContent = value;
    encodedName.textContent = name;
    nameRow.hidden = !name;
    error.hidden = true;
    result.hidden = false;
    updateForm();

    if (animate) {
        statusMessage.textContent = 'QR code created for: ' + shorten(value);
        playScanLine();
        showNewCode();
    }
}

// ===== Events =====
form.addEventListener('submit', function (event) {
    event.preventDefault();
    hint.hidden = true;
    generate(true);
});

input.addEventListener('input', function () {
    // Typing in the main box replaces whatever the Wi-Fi fields built
    wifiFields.hidden = true;
    updateForm();
});
nameInput.addEventListener('input', updateForm);
wifiName.addEventListener('input', updateFromWifiFields);
wifiPassword.addEventListener('input', updateFromWifiFields);

document.querySelectorAll('.chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
        const template = TEMPLATES[chip.dataset.template];
        const isWifi = chip.dataset.template === 'wifi';

        wifiFields.hidden = !isWifi;
        hint.textContent = template.hint;
        hint.hidden = false;
        error.hidden = true;

        if (isWifi) {
            updateFromWifiFields();
            wifiName.focus();
        } else {
            input.value = template.value;
            updateForm();
            input.focus();
        }
    });
});

// ===== First load: show a code for the example link =====
updateThemeButton();
generate(false);
updateForm();
