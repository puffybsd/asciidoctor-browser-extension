// Namespace
const webExtension = typeof browser === 'undefined' ? chrome : browser;

const asciidoctor = {};
asciidoctor.browser = {};

asciidoctor.browser.ENABLE_RENDER_KEY = 'ENABLE_RENDER';
asciidoctor.browser.ALLOW_TXT_EXTENSION_KEY = 'ALLOW_TXT_EXTENSION';

const AUTO_RELOAD_INTERVAL_TIME = 2000;

asciidoctor.browser.asciidocify = function () {
  const txtExtensionRegex = /\.txt[.|?]?.*?$/;
  if (location.href.match(txtExtensionRegex)) {
    isTxtExtAllowed(function (allowed) {
      // Extension allows txt extension
      if (allowed) {
        fetchContent();
      }
    });
  } else {
    fetchContent();
  }
};

asciidoctor.browser.loadContent = function (data) {
  isExtensionEnabled(function (enabled) {
    // Extension is enabled
    if (enabled) {
      asciidoctor.browser.appendStyles();
      asciidoctor.browser.appendMathJax();
      asciidoctor.browser.appendHighlightJsScript();
      asciidoctor.browser.convert(data.responseText);
    }
    startAutoReload();
  });
};

/**
 * Get user's setting defined in the options page.
 */
asciidoctor.browser.getSetting = function (key, callback) {
  webExtension.storage.local.get(key, function (items) {
    callback(items[key]);
  });
};

function isTxtExtAllowed (callback) {
  webExtension.storage.local.get(asciidoctor.browser.ALLOW_TXT_EXTENSION_KEY, function (items) {
    const allowed = items[asciidoctor.browser.ALLOW_TXT_EXTENSION_KEY] === 'true';
    callback(allowed);
  });
}

function isExtensionEnabled (callback) {
  asciidoctor.browser.getSetting(asciidoctor.browser.ENABLE_RENDER_KEY, callback);
}

function isLiveReloadDetected (callback) {
  asciidoctor.browser.getSetting(asciidoctor.browser.LIVERELOADJS_DETECTED_KEY, callback);
}

function getMd5sum (key, callback) {
  asciidoctor.browser.getSetting(key, callback);
}

function fetchContent () {
  $.ajax({
    url: location.href,
    cache: false,
    complete: function (data) {
      if (isHtmlContentType(data)) {
        return;
      }
      asciidoctor.browser.loadContent(data);
    }
  });
}

function reloadContent (data) {
  isLiveReloadDetected(function (liveReloadDetected) {
    // LiveReload.js has been detected
    if (!liveReloadDetected) {
      const key = 'md5' + location.href;
      getMd5sum(key, function (md5sum) {
        if (md5sum && md5sum === md5(data)) {
          return;
        }
        // Content has changed...
        isExtensionEnabled(function (enabled) {
          // Extension is enabled
          if (enabled) {
            // Convert AsciiDoc to HTML
            asciidoctor.browser.convert(data);
          } else {
            // Display plain content
            $(document.body).html(`<pre style="word-wrap: break-word; white-space: pre-wrap;">${$(document.body).text(data).html()}</pre>`);
          }
          // Update md5sum
          const value = {};
          value[key] = md5(data);
          webExtension.storage.local.set(value);
        });
      });
    }
  });
}

let autoReloadInterval;

function startAutoReload () {
  clearInterval(autoReloadInterval);
  autoReloadInterval = setInterval(function () {
    $.ajax({
      beforeSend: function (xhr) {
        if (xhr.overrideMimeType) {
          xhr.overrideMimeType('text/plain;charset=utf-8');
        }
      },
      url: location.href,
      cache: false,
      success: function (data) {
        reloadContent(data);
      }
    });
  }, AUTO_RELOAD_INTERVAL_TIME);
}

/**
 * Is the content type html ?
 * @param data The data
 * @return true if the content type is html, false otherwise
 */
function isHtmlContentType (data) {
  const contentType = data.getResponseHeader('Content-Type');
  return contentType && (contentType.indexOf('html') > -1);
}
