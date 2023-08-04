const { SportItaliaPage } = require('./SportItaliaPage');
const {Builder,By, until, WebDriver, WebDriverWait} = require('./selenium');

class Helper {
     // Function to pause execution for a certain duration
static async pause(duration) {
    await new Promise(resolve => setTimeout(resolve, duration));
  }

  //----------------------------------------
//GENERAL HELPER FUNCTIONS 
//----------------------------------------

// Funzione per creare sottoarray di lunghezza 2
static async creaSottoarrayDiLunghezza2(array) {
    const sottoarray = [];
    let i = 0;
  
    while (i < array.length) {
      sottoarray.push([array[i], array[i + 1]]);
      i += 2;
    }
  
    return sottoarray;
  }
  static async  visualizzaElementi(array) {
    // Controlla se l'input è un array
    if (Array.isArray(array)) {
      // Scorrere tutti gli elementi dell'array
      for (let i = 0; i < array.length; i++) {
        const elemento = array[i];
        
        // Se l'elemento è un array, richiamare la funzione ricorsivamente
        if (Array.isArray(elemento)) {
          await this.visualizzaElementi(elemento);
        } else {
          // Altrimenti, stampare l'elemento
          console.log(elemento);
        }
      }
    }
  }
  // Function to wait for an element to appear in the DOM
  static async  getTipoDiGiocataText(element) {
    return await element.getText();
  }
  static async  visualizzaElementiArr(array) {
    let risultato = [];
  
    for (let i = 0; i < array.length; i++) {
      let elemento = await array[i].getText();
      risultato.push(elemento);
    }
  
    return risultato;
  }
  static async scrollDown(times) {
      for (let i = 0; i < times; i++) {
        // Scroll down by 200 pixels
        await this.driver.executeScript('window.scrollBy(0, +200);');
        await this.driver.sleep(2000);
      }
  }
  static async scrollUp() {
      // Scroll up by 200 pixels
      await this.driver.executeScript('window.scrollBy(0, -200);');
      await this.driver.sleep(2000);
  }
  static async waitForDOMContentLoaded() {
    await this.driver.executeScript(`
      return new Promise(resolve => {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
          resolve();
        } else {
          document.addEventListener('DOMContentLoaded', () => {
            resolve();
          });
        }
      });
    `);
  }
  static async waitUntilClickable(element) {
    const waitTimeout = 10000; // Timeout in milliseconds
    // const driver = element.parent || element.getDriver();
  
    const startTime = Date.now();
  
    while (true) {
      const enabled = element.isEnabled();
  
      if (enabled) {
        return element;
      }
  
      const currentTime = Date.now();
      if (currentTime - startTime > waitTimeout) {
        throw new Error('Timeout: Element is not clickable.');
      }
  
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  static async wait(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }
  static async waitForElement(locator, timeout = 10000, className = '') {
    const condition = until.elementLocated(locator);
    if (className !== '') {
      await new WebDriverWait(this.driver, timeout).until( async () => {
        const element = await this.driver.findElement(locator);
        const classAttr = await element.getAttribute('class');
        return classAttr.includes(className);
      });
    }
    return await this.driver.wait(condition, timeout);
}
  static async logKeysAndValues(array) {
    array.forEach((object, index) => {
      console.log('Object', index + 1);
      Object.keys(object).forEach((key) => {
        console.log('Key:', key);
        console.log('Value:', object[key]);
      });
    });
  }

}

module.exports = Helper;