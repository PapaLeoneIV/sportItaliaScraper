const fs = require('fs');
const {By, until, WebDriver, WebDriverWait} = require('./selenium');

// Define the types of games and sub-games
//,'FUORIGIOCO', 'FALLI COMMESSI','CARTELLINI','TIRI',"CALCI D'ANGOLO", 'GOALS'
//,"U/O ANGOLI","GOAL/NO GOAL",'U/O TIRI TOTALI', "U/O TIRI IN PORTA","OVER/UNDER", "U/O FUORIGIOCO", "U/O FALLI COMMESSI" 
//"INTERNAZIONALE","INTERNAZIONALI GIOVANILI", "ARGENTINA","FINLANDIA","LITUANIA", 
const tipiDiGiocateArr = new Set(['FUORIGIOCO', 'FALLI COMMESSI','CARTELLINI','TIRI',"CALCI D'ANGOLO"]);
const tipiDiSottoGiocateArr = new Set(["U/O ANGOLI",'U/O TIRI TOTALI','U/O TIRI TOTALI TEAM', "U/O TIRI IN PORTA","U/O TIRI IN PORTA TEAM","U/O FUORIGIOCO", "U/O FALLI COMMESSI" ]);
const giocateSpeciali = new Set (["U/O ANGOLI", "CARTELLINI"])
const tipiDiNazioniArr = new Set (["INGHILTERRA", "CONFERENCE LEAGUE", "ARGENTINA","BRASILE", "COLOMBIA", "CHAMPIONS LEAGUE", "INTERNAZIONALI CLUB"])
 // Define the SportItaliaPage class

class SportItaliaPage {
  constructor(driver) {
    this.driver = driver;
}
//----------------------------------------
//HELPER FUNCTIONS TO SET UP THE WEB PAGE
//----------------------------------------
async maximizeWindow() {
    await this.driver.manage().window().maximize();
    console.log("Maximizing window")
}
// Function to navigate to a page
async navigateToPage(url) {
    await this.driver.get(url);
    console.log("Navigating to the URL")
}

//----------------------------------------
//----------------------------------------

async apriPalinsestoDiOggi() {
    try {
      await this.pause(5);
  
      // Find the active element in the list and click it
      const elements = await this.driver.findElements(By.css("div ul li.active li.evidenza-primary"));
      const element = elements[1];
  
      await this.scrollDown(2);
      await this.scrollUp();
  
      let clickableButton = await this.driver.wait(until.elementIsEnabled(element));

  
      if (clickableButton) {
        await clickableButton.click();
        console.log("Ho aperto il palinsesto di oggi");
      }
    } catch (error) {
      console.trace("Error while opening palinsesto di oggi:", error.message);
    }
}
async collectTipiDiScommesse() {

        await this.driver.wait(until.elementsLocated(By.css("ul.mastergroups li.ng-scope.type-item")));
        const giocateArr = await this.driver.findElements(By.css("ul.mastergroups li.ng-scope.type-item"));
  
        if (giocateArr.length < 10 ) {
          // Il selettore CSS non ha raccolto alcun dato
          console.log("Nessun dato raccolto. Ripetere il processo.");
          await this.pause(3)
          await this.collectTipiDiScommesse()
          // Aggiungi qui eventuali azioni per ripristinare il processo
        } else {

          for (let i = 0; i < giocateArr.length; i++) {
            let objArr = []
            const tipoDiGiocataText = await this.getTipoDiGiocataText(giocateArr[i]);
  
            if (tipiDiGiocateArr.has(tipoDiGiocataText)) {
              console.log(`Questo è il primo tipo di scommesse che ci interessano, il testo è: --> ${tipoDiGiocataText}`);
              objArr = await this.collectSottoScommesse(giocateArr[i])
              objArr.forEach(obj => {
                obj.Giocata = tipoDiGiocataText
              })
              await this.logKeysAndValues(objArr)
            } else {
              console.log(`non è nei nostri interessi ----> ${tipoDiGiocataText}  (collectTipiDiScommesse).`);
            }
          }
        }
}
async collectSottoScommesse(tipoDiGiocata) {
  await tipoDiGiocata.click();
  await this.pause(3);

  const tipiDiGiocateSpecificheElements = await this.driver.findElements(By.css("[title='Clicca per aprire i principali']"));

  const objArr = [];

  for (let i = 0; i < tipiDiGiocateSpecificheElements.length; i++) {

    const element = tipiDiGiocateSpecificheElements[i];
    const tipoDiGiocata = await this.getTipoDiGiocataText(element);

    if (!tipiDiSottoGiocateArr.has(tipoDiGiocata)) {
      console.log("il tipo di sottogiocata non è presente nelle tue sottoscommesse (CollectSottoScommesse)");
      continue;
    }

    await element.click();
    await this.pause(3);
    console.log(`sto cliccando su -----> ${tipoDiGiocata}`);

    const nazioniArr = await this.driver.findElements(By.css("[ng-click='bpManifestazioneCtrl.manifestazioneobj.SelectCountryMatch(country, null)']"));

    for (let j = 0; j < nazioniArr.length; j++) {
      
      await this.pause(2);
      const nazioneElement = nazioniArr[j];
      let nazione = (await nazioneElement.getText()).trim();

      if (!tipiDiNazioniArr.has(nazione)) {
        continue;
      }

      if (!(await this.driver.wait(until.elementIsEnabled(nazioneElement)))) {
        console.log("there has been a problem");
        continue;
      }

      try {
        console.log("sto clickando sulla nazione", nazione)
        await nazioneElement.click();
      } catch (error) {
        if (error) {
          const currentPosition = await this.driver.executeScript('return { x: window.scrollX, y: window.scrollY };');
          const newX = currentPosition.x + 50;
          const newY = currentPosition.y + 50;
          await this.driver.executeScript(`window.scrollTo(${newX}, ${newY});`);
          await nazioneElement.click();
        }
      }

      const currentObjArr = await this.collectAllTheInfo(tipoDiGiocata);
      currentObjArr.forEach((obj) => {
        obj.TipoDiGiocata = tipoDiGiocata;
        obj.Nazione = nazione;

        objArr.push(obj);
      });
    }
  }

  return objArr;
}

//----------------------------------------
//----------------------------------------

async collectAllTheInfo(tipoDiGiocata) {
console.log("line 156_____________________________")
  await this.pause(2);
   // Collect date information
  let date = await this.collectDateInfo();
   // Collect teams names
  let teamsNamesArrBlob = await this.collectTeamsName();
   // Collect teams lineas
  let lineaArrBlob = await this.collectTeamsLinea(tipoDiGiocata);
   // Collect tipo di quota
  let tipoDiQuotaArr = await this.collectTipoDiQuota();
   // Group tipo di quota into separate arrays
  let quotaGroups = tipoDiQuotaArr.map(quota => [quota]);

     // Group teams names into pairs
     let teamsGroups = [];
     for(let i = 0; i < teamsNamesArrBlob.length; i += 2){
       const group = teamsNamesArrBlob.slice(i, i + 2);
       teamsGroups.push(group);
     }
   // Normalize data
  let objArr = await this.normalizeData(date, teamsGroups, lineaArrBlob, quotaGroups, tipoDiGiocata);
   return objArr;
}
async collectTipoDiQuota() {
    let array = []
    let tipoDiQuota = await this.driver.findElements(By.css(".type__name span.ng-binding" || ""))
        //il for loop serve ad attraversare i vari tipi di quota e raccoglierli in un array 
        for(let i = 0; i < tipoDiQuota.length; i++){
          let quotaText = tipoDiQuota[i].getText()
          array.push(quotaText)
        }
        return array
}
async collectTeamsLinea(tipoDiGiocata) {
    let array = []
        // Selettore CSS composto per combinare i due selettori
    const selector1 = ".quote__row__item--handicap div span.ng-binding";
    const selector2 = "div.box_quota.box_quota--manifestazione[ng-if='!BQCoreCtrl.boxQuotaObj.Status.Exist'] div.outcome_wrapper span";
    const composedSelector = `${selector1},${selector2}`;
        //variabili per ottenere i div dove sono contenuti i dati che ci interessano 
    let fatherBox = await this.driver.findElement(By.className("betprematch__manifestazione__quote__scrolls ng-scope"))
    let divConQuoteSquadre = await fatherBox.findElements(By.css("div.betprematch__manifestazione__quote div.betprematch__manifestazione__quote__item"))
    
    if(giocateSpeciali.has(tipoDiGiocata)){
      let array = await this.collectTeamsLineaHover()
      console.log("Sto raccogliendo i dati ma ho bisogno di fare hover con il mouse", array)
      return array
    } else {
      //raccogliere la linea gia presente
      for (let i = 0; i < divConQuoteSquadre.length; i++){

        const elements = await this.driver.findElements(By.css(composedSelector));   
    
          for(let j = 0; j < elements.length; j++ ){
            
          let quota = ""
          quota = elements[j].getText()
          array.push(quota)      
          }
          console.log("THis is teamsLinea in  (collectTeamsQuota)",array)
          return array
        }
    }

}
async collectDateInfo() {
     let dataFather = await this.driver.findElement(By.css("betprematch div.betprematch__manifestazione__event__date"));
     let daynumber = await dataFather.findElement(By.css("div.betprematch__manifestazione__event__date span.daynumber")).getText();
     let month = await dataFather.findElement(By.css("div.betprematch__manifestazione__event__date span.month")).getText();
     let day = await dataFather.findElement(By.css("div.betprematch__manifestazione__event__date span.day")).getText();
     let dateString = daynumber + " " + month + ", " + day;
     return dateString;
}
async collectTeamsName() {
    let father = await this.driver.findElement(By.css("div.betprematch__manifestazione__content.item0"));
    let teamsInfoLeftColumn = await father.findElement(By.css("div.betprematch__manifestazione__events"));
    let teamsInfoArr = await teamsInfoLeftColumn.findElements(By.css("div.match__row__wrapper"));
    let array = [];
  
    for (let i = 0; i < teamsInfoArr.length; i++) {
      let isDisplayed = await teamsInfoArr[i].isDisplayed();
      
      if (isDisplayed) {
        let squadsArr2 = await teamsInfoArr[i].findElements(By.css(".match__row__teams__name span.ng-binding"));
        let sq1 = await squadsArr2[0].getText();
        let sq2 = await squadsArr2[1].getText();
        array.push([sq1,sq2])
   }
  }
  return array
}
async collectTeamsLineaHover(){
  let array = []
  let outsideDivs = await this.driver.findElements(By.css("div.ng-scope.quote__row__item--handicap"));
  await this.scrollDown(1)
  console.log("outsideDiv length: ", outsideDivs.length)

  for (let j = 0; j < outsideDivs.length; j++){
    this.pause(1.5)
    const actions = this.driver.actions({ async: true });

    await actions.move({ origin: outsideDivs[j] }).perform();  
    // Aspetta che il div fantasma appaia (puoi aggiustare il selettore CSS in base alla tua struttura HTML)
  //await this.driver.wait(until.elementLocated(By.className('.quote__row__item--handicap__dropdown')), 10000);

    // Ottieni il testo all'interno del div fantasma e stampalo
    let ghostDiv = await this.driver.findElement(By.css('.quote__row__item--handicap__dropdown'));
    for(let i = 0; i < 1;i++){
      let selector1big = ".betprematch__manifestazione__quote table tr td span.ng-binding.quota"
      let selector2 = "table tbody tr td small.ng-binding"
      const composedSelector = `${selector1big},${selector2}`;
      const elements = await this.driver.findElements(By.css(composedSelector))
      if (i === 0) {
        elements.forEach(obj =>{
          let x = obj.getText()
          array.push(x)
      })
      } else continue
    }
  }  

  return array 
}
async moveCursorToElement(webElement) {
  let text = await webElement.getAttribute("class")
  console.log("text", text)
  let locator =  text
  const actions = this.driver.actions({ async: true });
  const element = await this.driver.findElement(By.css(locator));
  await actions.move({ origin: element }).perform();
}
async normalizeData(date, teamsGroups, lineaArrBlob, quotaGroups, tipoDiGiocata) {
  const objArray = [];

  const l2Array = await this.creaSottoarrayDiLunghezza2(teamsGroups.flat(Infinity));

  if (giocateSpeciali.has(tipoDiGiocata)) {
    await this.normalizeSpecialData(date, l2Array, lineaArrBlob, quotaGroups, objArray);
  } else {
    await this.normalizeRegularData(date, l2Array, lineaArrBlob, quotaGroups, objArray);
  }

  return objArray;
}

async normalizeSpecialData(date, l2Array, lineaArrBlob, quotaGroups, objArray) {
  const x = lineaArrBlob.length / l2Array.length;
  const chunk = await lineaArrBlob.slice(0, x);

  for (let i = 0; i < l2Array.length; i++) {
    for (let j = 0; j < chunk.length; j += 3) {
      const obj = {
        Date: date,
        Squadra1: l2Array[i][0],
        Squadra2: l2Array[i][1],
        Quota: quotaGroups[0],
        Linea: chunk[j],
        UNDER: chunk[j + 1],
        OVER: chunk[j + 2],
      };
      objArray.push(obj);
    }
  }
}

async normalizeRegularData(date, l2Array, lineaArrBlob, quotaGroups, objArray) {
  let l = lineaArrBlob.length / quotaGroups.length;

  for (let i = 0; i < quotaGroups.length; i++) {
    const chunk = await lineaArrBlob.splice(0, l);
    for (let k = 0; k < chunk.length; k++) {
      const obj = {
        Date: date,
        Squadra1: l2Array[k][0],
        Squadra2: l2Array[k][1],
        Quota: quotaGroups[i],
        Linea: chunk[k],
      };
      objArray.push(obj);
    }
  }
}


// async normalizeData(date, teamsGroups, lineaArrBlob, quotaGroups, tipoDiGiocata) {
//   let objArray = []
  

//   let flatArray = teamsGroups.flat(Infinity)
//   let l2Array = await this.creaSottoarrayDiLunghezza2(flatArray)
//   console.log("l2", l2Array, "teamsGroup:", teamsGroups,"lineaArrBlob:", lineaArrBlob,"quotaGroups:", quotaGroups)
//   if (giocateSpeciali.has(tipoDiGiocata)) {
//     let x = lineaArrBlob.length/l2Array.length //ovvero tutte le linee raccolte diviso il numero di squadre = linee tot per ogni coppia di squaddre
    
//     let chunk = await lineaArrBlob.slice(0,x) //è uguale di lunghezza a tutte le linee presenti nel div
//     console.log("This is x = ", x , "this is chunk speciale0", chunk, chunk.length)
//     for(let i= 0; i < l2Array.length; i++){
//       for(let j = 0; j < chunk.length; j+= 3){
//          let obj = {}
//          obj.date = date
//          obj.squadra1 = l2Array[i][0]
//          obj.squadra2 = l2Array[i][1]
//          obj.quota = quotaGroups[0]
//          obj.linea = chunk[j]
//          obj.linea.under = chunk[j+1]
//          obj.linea.over = chunk[j+2]

//          objArray.push(obj)

         
//         console.log("sto creando l oggetto speciale e lo sto pushando")
//       }
//     }
//   } else {
//     console.log(flatArray)
//     let l = lineaArrBlob.length / quotaGroups.length
   
//     for(let i = 0; i < quotaGroups.length; i++){
//       const chunk = await lineaArrBlob.splice(0, l)
//       console.log("This is chunk:", chunk)
//       for(let k = 0; k < chunk.length ; k++){
//         let obj = {}
//         obj.date = date
//         obj.squadra1 = l2Array[k][0]
//         obj.squadra2 = l2Array[k][1]
      
//         obj.quota = quotaGroups[i]
//         obj.linea = chunk[k]
        
//         objArray.push(obj)
//       }
//     //prendo l2array e creo una variabile x = l2.slice(0,1) 
//     //in modo tale che ad ogni nuova iterazione sia sempre il primo della lista ad essere selezionato (x = [sq1,sq2])
  
//   }
//   }
 


// return objArray
// }

//----------------------------------------
//GENERAL HELPER FUNCTIONS 
//----------------------------------------

// Funzione per creare sottoarray di lunghezza 2
async creaSottoarrayDiLunghezza2(array) {
  const sottoarray = [];
  let i = 0;

  while (i < array.length) {
    sottoarray.push([array[i], array[i + 1]]);
    i += 2;
  }

  return sottoarray;
}
async  visualizzaElementi(array) {
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
// Function to pause execution for a certain duration
async pause(duration) {
    await new Promise(resolve => setTimeout(resolve, duration * 1000));
}
// Function to wait for an element to appear in the DOM
async waitForElement(locator, timeout = 10000, className = '') {
    const condition = until.elementLocated(locator);
    if (className !== '') {
      await new WebDriverWait(this.driver, timeout).until(async () => {
        const element = await this.driver.findElement(locator);
        const classAttr = await element.getAttribute('class');
        return classAttr.includes(className);
      });
    }
    return await this.driver.wait(condition, timeout);
}
async  getTipoDiGiocataText(element) {
  return await element.getText();
}
async  visualizzaElementiArr(array) {
  let risultato = [];

  for (let i = 0; i < array.length; i++) {
    let elemento = await array[i].getText();
    risultato.push(elemento);
  }

  return risultato;
}
async scrollDown(times) {
    for (let i = 0; i < times; i++) {
      // Scroll down by 200 pixels
      await this.driver.executeScript('window.scrollBy(0, +200);');
      await this.driver.sleep(2000);
    }
}
async scrollUp() {
    // Scroll up by 200 pixels
    await this.driver.executeScript('window.scrollBy(0, -200);');
    await this.driver.sleep(2000);
}
async waitForDOMContentLoaded() {
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
async waitUntilClickable(element) {
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
async wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}
async logKeysAndValues(array) {
  array.forEach((object, index) => {
    console.log('Object', index + 1);
    Object.keys(object).forEach((key) => {
      console.log('Key:', key);
      console.log('Value:', object[key]);
    });
  });
}
//----------------------------------------
//HELPER FUNCTIONS PER MANIPOLARE FILE CON I DATI DI NOSTRO INTERESSE 
//----------------------------------------
async createFileCSV() {
  const header = ["Data","Campionato","Squadra1", "Squadra2","Tipo_Di_Giocata", "Linea_Sq1", "Linea_Sq2","Linea_Tot" ]
  const csvData = header.join(',') + '\n';

  fs.writeFileSync("csvFileLineaGiocate", csvData, 'utf8');
}
// Funzione per aggiungere una riga al file CSV
async appendToCSV(data) {
  const csvData = `${data.data},${data.campionato},${data.squadra1},${data.squadra2},${data.tipoDigiocata},${data.linea_Sq1},${data.linea_Sq2},${data.linea_Tot}\n`;

  fs.appendFileSync("csvFileLineaGiocate", csvData, 'utf8');
}
async createCSVFileIfNotExist(data, campionato, squadra1, squadra2, tipoDigiocata, linea_Sq1, linea_Sq2, linea_Tot) {
  if (!fs.existsSync("csvFileLineaGiocate")) {
    createNewCSV();
  }

  try {
    await this.appendToCSV()
    //qui devo fare la formattazione dei vari dati che mi interessano o se l ho gia fatta refactor e creazione file
  } catch (error) {
    console.log(error.message)
  }
}
//----------------------------------------
// HELPER FUNCTIONS TO CLOSE POP UPS
//----------------------------------------

// Function to close the pop-up
async closePopUp() {
    try {
      await this.waitForElement(By.id('onesignal-slidedown-container'));
      const onesignalPopup = await this.driver.findElement(By.id('onesignal-slidedown-container'));
      await this.driver.executeScript("arguments[0].style.display = 'none';", onesignalPopup);
      console.log("I've closed the second popup")
    } catch (error) {
      console.error('An error occurred:', error);
    }
}
// Function to close the Iubenda pop-up
async closeIubendaPopUp() {
    try {
      await this.waitForElement(By.css('button.iubenda-cs-btn-primary.iubenda-cs-reject-btn'));
      const iuberndaPopUpBtn = await this.driver.findElement(By.css("button.iubenda-cs-btn-primary.iubenda-cs-reject-btn"));
      await iuberndaPopUpBtn.click();
      console.log("I m abut to close the pop up")
    } catch (error) {
      console.error("Error while closing the pop-up 1 window:", error.message);
    }
}

async closeTempPopUp() {
    try {
     
      const tempPopUp = await this.driver.findElement(By.className("messagebox__item__close ng-scope"));
      await tempPopUp.click();
    } catch (error) {
      console.error("Error while closing the Temporary popup window:", error.message);
    }
}


async closeMobilePopUp() {
    try {
      console.log("Attempting to close the Mobile  pop-up windows");
     
      const mobilePopUpFather = await this.driver.findElement(By.className("gotomobile"));
      const mobilePopUp = await mobilePopUpFather.findElement(By.className("icon-close"));
      await mobilePopUp.click();
      console.log("Pop-up Temp windows closed successfully");
    } catch (error) {
      console.error("Error while closing the Mobile  popup window:", error.message);
    }
}

}

module.exports = { SportItaliaPage, WebDriver };
