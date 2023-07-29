const { Builder, By, Key, until, WebDriver, WebDriverWait } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { ExpectedConditions } = require('selenium-webdriver');

const options = new chrome.Options();
options.addArguments('--disable-notifications');

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

module.exports = { Builder, By, Key, until, WebDriver, WebDriverWait, chrome, ExpectedConditions, options, userAgent };



