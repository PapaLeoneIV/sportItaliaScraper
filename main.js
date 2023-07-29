const { Builder } = require('./selenium');
const { SportItaliaPage, tipiDiGiocateArr, tipiDiSottoGiocateArr, options } = require('./SportItaliaPage');

async function runScript() {
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  const sportItaliaPage = new SportItaliaPage(driver);

    await sportItaliaPage.maximizeWindow()
    await sportItaliaPage.navigateToPage('https://sportitaliabet.it/bet');
    await sportItaliaPage.closeIubendaPopUp();
    await sportItaliaPage.closePopUp();  
    await sportItaliaPage.pause(4)
    await sportItaliaPage.apriPalinsestoDiOggi();
    await sportItaliaPage.pause(5)
    await sportItaliaPage.collectTipiDiScommesse();
    // ... altre azioni del tuo script ...


  
}

runScript();
