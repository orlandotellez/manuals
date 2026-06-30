(function() {
    'use strict';

    function addDarkThemeButton() {
        var themeList = document.getElementById('mdbook-theme-list');
        if (!themeList) return;

        // Check if button already exists
        if (document.getElementById('mdbook-theme-dark')) return;

        var li = document.createElement('li');
        li.setAttribute('role', 'none');
        li.innerHTML = '<button role="menuitem" class="theme" id="mdbook-theme-dark">Dark</button>';

        // Add before Ayu
        var ayuItem = themeList.querySelector('#mdbook-theme-ayu');
        if (ayuItem && ayuItem.parentElement) {
            themeList.insertBefore(li, ayuItem.parentElement);
        } else {
            themeList.appendChild(li);
        }
    }

    function updateHighlightForDark() {
        var html = document.documentElement;
        if (html.classList.contains('dark')) {
            var ayuHighlight = document.getElementById('mdbook-ayu-highlight-css');
            var tomorrowNight = document.getElementById('mdbook-tomorrow-night-css');
            var highlight = document.getElementById('mdbook-highlight-css');
            if (ayuHighlight) ayuHighlight.disabled = true;
            if (tomorrowNight) tomorrowNight.disabled = false;
            if (highlight) highlight.disabled = true;

            // Update theme-color meta tag
            var meta = document.querySelector('meta[name="theme-color"]');
            if (meta) meta.content = '#000000';
        }
    }

    // Add the button when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addDarkThemeButton);
    } else {
        addDarkThemeButton();
    }

    // Run highlight fix immediately
    updateHighlightForDark();

    // Observe html class changes
    var observer = new MutationObserver(function() {
        updateHighlightForDark();
    });
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
    });
})();
