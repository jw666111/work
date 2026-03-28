"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // src/code.ts
  var require_code = __commonJS({
    "src/code.ts"(exports) {
      figma.showUI(__html__, {
        width: 420,
        height: 600,
        themeColors: true
      });
      var DEFAULT_SETTINGS = {
        activeAgentId: null,
        agents: [],
        globalBrandTerms: [],
        globalRules: [],
        historyLimit: 100
      };
      var CATEGORY_PATTERNS = {
        button: ["btn", "button", "cta", "action"],
        title: ["title", "header", "heading", "headline", "h1", "h2", "h3"],
        description: ["desc", "description", "subtitle", "tip", "hint", "caption"],
        placeholder: ["input", "placeholder", "search", "field"],
        feedback: ["toast", "error", "success", "warning", "alert", "message", "notification"],
        label: ["label", "form", "field-label"],
        link: ["link", "nav", "menu", "navigation", "anchor"],
        general: []
      };
      function categorizeText(node) {
        const names = [];
        let current = node;
        while (current && names.length < 5) {
          names.push(current.name.toLowerCase());
          current = current.parent;
        }
        const combinedNames = names.join(" ");
        for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
          if (category === "general")
            continue;
          for (const pattern of patterns) {
            if (combinedNames.includes(pattern)) {
              return category;
            }
          }
        }
        return "general";
      }
      function getTextContext(node) {
        const contextParts = [];
        let current = node.parent;
        let depth = 0;
        while (current && depth < 3) {
          if (current.type === "FRAME" || current.type === "COMPONENT" || current.type === "INSTANCE") {
            contextParts.push(current.name);
          }
          current = current.parent;
          depth++;
        }
        return contextParts.reverse().join(" > ") || "\u672A\u77E5\u4F4D\u7F6E";
      }
      function getTextNodes(node) {
        const textNodes = [];
        if (node.type === "TEXT") {
          textNodes.push(node);
        } else if ("children" in node) {
          for (const child of node.children) {
            textNodes.push(...getTextNodes(child));
          }
        }
        return textNodes;
      }
      function scanTexts(scope) {
        let textNodes = [];
        if (scope === "selection") {
          for (const node of figma.currentPage.selection) {
            textNodes.push(...getTextNodes(node));
          }
        } else {
          for (const node of figma.currentPage.children) {
            textNodes.push(...getTextNodes(node));
          }
        }
        return textNodes.map((node) => ({
          id: node.id,
          name: node.name,
          characters: node.characters,
          context: getTextContext(node),
          category: categorizeText(node),
          fontSize: node.fontSize,
          position: { x: node.x, y: node.y }
        }));
      }
      function applyOptimization(nodeId, newText) {
        return __async(this, null, function* () {
          const node = figma.getNodeById(nodeId);
          if (!node || node.type !== "TEXT") {
            return false;
          }
          try {
            yield figma.loadFontAsync(node.fontName);
            node.characters = newText;
            return true;
          } catch (error) {
            console.error("Failed to apply optimization:", error);
            return false;
          }
        });
      }
      function revertText(nodeId, originalText) {
        return __async(this, null, function* () {
          return applyOptimization(nodeId, originalText);
        });
      }
      function loadSettings() {
        return __async(this, null, function* () {
          try {
            const settings = yield figma.clientStorage.getAsync("settings");
            return settings ? __spreadValues(__spreadValues({}, DEFAULT_SETTINGS), settings) : DEFAULT_SETTINGS;
          } catch (error) {
            console.error("Failed to load settings:", error);
            return DEFAULT_SETTINGS;
          }
        });
      }
      function saveSettings(settings) {
        return __async(this, null, function* () {
          try {
            yield figma.clientStorage.setAsync("settings", settings);
            return true;
          } catch (error) {
            console.error("Failed to save settings:", error);
            return false;
          }
        });
      }
      function loadHistory() {
        return __async(this, null, function* () {
          try {
            const history = yield figma.clientStorage.getAsync("history");
            return history || [];
          } catch (error) {
            console.error("Failed to load history:", error);
            return [];
          }
        });
      }
      function addHistory(record) {
        return __async(this, null, function* () {
          try {
            const history = yield loadHistory();
            const settings = yield loadSettings();
            history.unshift(record);
            if (history.length > settings.historyLimit) {
              history.splice(settings.historyLimit);
            }
            yield figma.clientStorage.setAsync("history", history);
            return true;
          } catch (error) {
            console.error("Failed to add history:", error);
            return false;
          }
        });
      }
      function clearHistory() {
        return __async(this, null, function* () {
          try {
            yield figma.clientStorage.setAsync("history", []);
            return true;
          } catch (error) {
            console.error("Failed to clear history:", error);
            return false;
          }
        });
      }
      figma.ui.onmessage = (msg) => __async(exports, null, function* () {
        var _a;
        switch (msg.type) {
          case "scan-texts": {
            const scope = ((_a = msg.payload) == null ? void 0 : _a.scope) || "selection";
            const texts = scanTexts(scope);
            figma.ui.postMessage({ type: "texts-scanned", payload: { texts } });
            break;
          }
          case "apply-optimization": {
            const { nodeId, newText, record } = msg.payload;
            const success = yield applyOptimization(nodeId, newText);
            if (success && record) {
              yield addHistory(record);
            }
            figma.ui.postMessage({
              type: "optimization-applied",
              payload: { nodeId, success }
            });
            break;
          }
          case "revert-text": {
            const { nodeId, originalText } = msg.payload;
            const success = yield revertText(nodeId, originalText);
            figma.ui.postMessage({
              type: "text-reverted",
              payload: { nodeId, success }
            });
            break;
          }
          case "get-settings": {
            const settings = yield loadSettings();
            figma.ui.postMessage({ type: "settings-loaded", payload: { settings } });
            break;
          }
          case "save-settings": {
            const success = yield saveSettings(msg.payload.settings);
            figma.ui.postMessage({ type: "settings-saved", payload: { success } });
            break;
          }
          case "get-history": {
            const history = yield loadHistory();
            figma.ui.postMessage({ type: "history-loaded", payload: { history } });
            break;
          }
          case "clear-history": {
            const success = yield clearHistory();
            figma.ui.postMessage({ type: "history-loaded", payload: { history: [] } });
            break;
          }
          case "close": {
            figma.closePlugin();
            break;
          }
        }
      });
    }
  });
  require_code();
})();
