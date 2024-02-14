
let obj = {
    date : date,
    nazione : nazione,
    squadra1: squadra1,
    squadra2: squadra2,
    giocate: {
        giocata : [{
        FUORIGIOCO: {}, 
        FALLI_COMMESSI: {},
        CARTELLINI: {
            UOCARTELLINI: [{
                    linea: 5.5,
                    under:UNDER, 
                    over: OVER
                
                },{
                    linea: 6.5,
                    under: UNDER,
                    over : OVER
                }]
        },
        TIRI: {
            tiriInPorta: 5.5,
            under: 1.34,
            over: 3.4
        },
        CALCI_DANGOLO: {}
    }]
    }

}

obj = {

    date : "27 luglio, giovedì",
    nazione : "ITALIA",
    squadra1: "milan ",
    squadra2: "inter",
    linea: "5.5",
    quota: "tiri in porta",
    tipodiGiocata: "Tiri"
}

or

obj = {

    date : "27 luglio, giovedì",
    nazione : "ITALIA",
    squadra1: "milan ",
    squadra2: "inter",
    quota: "tiri in porta",
    tipodiGiocata: "Tiri",
    linea: "5.5",
    under: "1.3",
    over: "3.4"
}