// ===== Settings =====
const QR_SIZE = 640;       // Width and height of the PNG, in pixels
const QR_MARGIN = 64;      // White border around the code, in pixels
const QR_LEVEL = 'M';      // Error correction without a name: L, M, Q or H
const QR_LEVEL_WITH_NAME = 'H';  // Keep this at H. The name hides part of the code,
                                 // and H is the level that can best recover from that.
const MAX_BYTES = { L: 2953, M: 2331, Q: 1663, H: 1273 };  // Content limit for each level

const NAME_FONT_SIZE = 44;       // Largest size of the name, in pixels on the PNG
const NAME_MAX_WIDTH = 0.5;      // Widest the name's box can be, as a share of the code

// What each starter button puts in the box, and the hint it shows
const TEMPLATES = {
    website: {
        value: 'https://',
        hint: 'Add the rest of the address after https://'
    },
    wifi: {
        value: 'WIFI:T:WPA;S:NetworkName;P:Password;;',
        hint: 'Replace NetworkName and Password. Anyone who sees this code can read the password.'
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
const error = document.getElementById('error');
const result = document.getElementById('result');
const canvas = document.getElementById('qr-canvas');
const codeFrame = document.getElementById('code-frame');
const encodedText = document.getElementById('encoded-text');
const download = document.getElementById('download');

// ===== Helpers =====
function toBytes(text) {
    return new TextEncoder().encode(text);
}

function currentLevel() {
    return nameInput.value.trim() ? QR_LEVEL_WITH_NAME : QR_LEVEL;
}

function updateByteCount() {
    const used = toBytes(input.value).length;
    const limit = MAX_BYTES[currentLevel()];
    byteCount.textContent = used.toLocaleString('en-US') + ' / ' + limit.toLocaleString('en-US') + ' bytes';
    byteCount.classList.toggle('over', used > limit);
}

// Draws the name in a white box over the middle of the finished code
function drawCenterName(name) {
    const context = canvas.getContext('2d');
    const fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--font-body');
    const sidePadding = 16;
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

// Brings the new code into view on small screens, where it sits below the form
function showResultOnSmallScreen() {
    if (!window.matchMedia('(max-width: 800px)').matches) {
        return;
    }
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    result.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
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

// ===== Generate the code =====
function generate(animate) {
    const value = input.value;
    const name = nameInput.value.trim();
    const level = currentLevel();
    const limit = MAX_BYTES[level];

    if (!value.trim()) {
        showError('Enter some text or a link first.');
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

    download.href = canvas.toDataURL('image/png');
    encodedText.textContent = value;
    encodedName.textContent = name;
    nameRow.hidden = !name;
    error.hidden = true;
    result.hidden = false;

    if (animate) {
        playScanLine();
        showResultOnSmallScreen();
    }
}

// ===== Events =====
form.addEventListener('submit', function (event) {
    event.preventDefault();
    hint.hidden = true;
    if (document.activeElement) {
        document.activeElement.blur(); // Closes the keyboard on phones
    }
    generate(true);
});

input.addEventListener('input', updateByteCount);
nameInput.addEventListener('input', updateByteCount);

document.querySelectorAll('.chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
        const template = TEMPLATES[chip.dataset.template];
        input.value = template.value;
        hint.textContent = template.hint;
        hint.hidden = false;
        error.hidden = true;
        updateByteCount();
        input.focus();
    });
});

// ===== First load: show a code for the example link =====
updateThemeButton();
updateByteCount();
generate(false);
