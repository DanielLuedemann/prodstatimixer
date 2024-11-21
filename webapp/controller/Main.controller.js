sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/Filter"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     * @param {typeof sap.m.MessageToast} MessageToast
     */
    function (Controller, MessageToast, Filter) {
        "use strict";
        return Controller.extend("com.iff.prodstatimixer.controller.Main", {
            onInit: function () {
                // Parameter für "Werks" ermitteln
                var complete_url = window.location.href;
                var pieces = complete_url.split("?");
                var params = pieces[1].split("&");
                var werks = "";
                $.each(params, function (key, value) {
                    var param_value = value.split("=");
                    console.log(key + ": " + value + " | " + param_value[1]);
                    if (param_value[0] === 'Werks') {
                        werks = param_value[1];
                    }
                })
                // Werks Parameter als gobale Variable im Controller definieren und belegen
                this._werks = werks;

                // WebSocket Verbindung zum Backend intialisieren
                this._initWS();

            },

            onAfterRendering: function () {
                // Neuen Filter passend zum Parameter Werks definieren
                var oFilterWerks = new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.EQ, this._werks);
                var that = this;

                // VizFrame Daten filtern
                var vizFrame = this.getView().byId("idVizFrame");
                var vizFrame2 = this.getView().byId("idVizFrame2");
                var vizFrame3 = this.getView().byId("idVizFrame3");
                var vizFrameGMB = this.getView().byId("idVizFrameGMB");
                var vizFrameAbfPuffer = this.getView().byId("idVizFrameAbfPuffer");
                var vizFrameDos = this.getView().byId("idVizFrameDosierung");
                var vizFrameFSAK = this.getView().byId("idVizFrameFSAK");

                // Filter anwenden für VizFrame Daten
                vizFrame.getDataset().getBinding("data").filter([oFilterWerks]);
                vizFrame2.getDataset().getBinding("data").filter([oFilterWerks]);
                vizFrame3.getDataset().getBinding("data").filter([oFilterWerks]);
                vizFrameGMB.getDataset().getBinding("data").filter([oFilterWerks]);
                vizFrameAbfPuffer.getDataset().getBinding("data").filter([oFilterWerks]);
                vizFrameDos.getDataset().getBinding("data").filter([oFilterWerks]);
                vizFrameFSAK.getDataset().getBinding("data").filter([oFilterWerks]);

                var oModel = this.getView().getModel();

                var sPath = "/HeaderSet";
                var oFilter = [
                    new Filter("Werks", "EQ", "FRL")
                ];
                var titel_txt = "";
                var titel_txt_erl = "";
                var menge = 0.0;
                var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
                oModel.read(sPath, {
                    filters: oFilter,
                    success: function (oData, oResponse) {
                        // save variable
                        oData.results.forEach(function (result) {
                            if (result.Ident == "komp") {
                                titel_txt = titel_txt + oResourceBundle.getText("title");
                                menge = Math.round(result.Menge / 100) / 10;
                                titel_txt = titel_txt + " - Aufträge: " + result.AnzAuftr + " Menge: " + menge + " t || ";
                                var vizFrame = that.getView().byId("idVizFrame");
                                vizFrame.setVizProperties({
                                    title: { text: titel_txt }
                                });
                            }
                            if (result.Ident == "mxak") {
                                titel_txt = titel_txt + oResourceBundle.getText("title2");
                                menge = Math.round(result.Menge / 100) / 10;
                                titel_txt = titel_txt + " - Aufträge: " + result.AnzAuftr + " Menge: " + menge + " t";
                                var vizFrame2 = that.getView().byId("idVizFrame");
                                vizFrame2.setVizProperties({
                                    title: { text: titel_txt }
                                });
                            }
                            if (result.Ident == "erl") {
                                titel_txt_erl = oResourceBundle.getText("title3");
                                menge = Math.round(result.Menge / 100) / 10;
                                titel_txt_erl = titel_txt_erl + ": " + result.AnzAuftr + " Menge: " + menge + " t";
                                var vizFrame3 = that.getView().byId("idVizFrame3");
                                vizFrame3.setVizProperties({
                                    title: { text: titel_txt_erl }
                                });
                            }
                        });
                    }.bind(this),
                    error: function (oError) {
                        // show error
                    }
                });

                vizFrameGMB.setVizProperties({
                    plotArea: { colorPalette: ["#5899da", "#19a979", "#e8743b"] },
                    interaction: { behaviorType: null },
                    tooltip: { visible: false },
                    title: { text: oResourceBundle.getText("titleGmb") }
                });
                vizFrameAbfPuffer.setVizProperties({
                    plotArea: { colorPalette: ["#19a979", "#e8743b"] },
                    interaction: { behaviorType: null },
                    tooltip: { visible: false },
                    title: { text: oResourceBundle.getText("titleAbf") }
                });

                // Tabellen Daten filtern    
                var uiTable = this.getView().byId("idMixerOrderTable");
                var uiTable2 = this.getView().byId("idMixAktOrderTable");
                // Filter anwenden
                uiTable.getBinding("rows").filter([oFilterWerks]);
                uiTable2.getBinding("rows").filter([oFilterWerks]);
            },

            onRenderComplete: function (oEvent) {
                // Basierend auf VizFrame Daten, die Spalten der Tabelle setzen
                var oChart = this.getView().byId("idVizFrame");
                // Anzahl der VizFrame Daten ermitteln
                var counter = oChart.getDataset().getBinding("data").getLength();
                //MessageToast.show(counter);
                // Anzahl der Spalten setzen für die Tabelle
                var oChart2 = this.getView().byId("idVizFrame2");
                var counter2 = oChart2.getDataset().getBinding("data").getLength();
                this._setTableColumnsVisible(counter, 'idMixerOrderTable');
                this._setTableColumnsVisible(counter2, 'idMixAktOrderTable');

                var oRows = this.getView().byId('idMixerOrderTable').getRows();
                $.each(oRows, function (i, e) {
                    //var oTable = that.getView().byId("idMixerOrderTable");
                    // Daten zur Tabellenzeile lesen
                    var oContext = oRows[i].getBindingContext();
                    for (var j = 0; j < oRows[i].getCells().length; j++) {
                        // Eine einzelne Zelle der Tabelle lesen
                        var oCell = oRows[i].getCells()[j];
                        // Nur Ändern, falls Daten zur Zeile vorhanden sind
                        if (oContext) {
                            // Name der Spalte dynamisch ermitteln
                            var sCProp = oContext.getProperty("C" + (j + 1) + "Prop");
                            // Zurücksetzen der CSS Formatierung
                            oCell.removeStyleClass("red");
                            oCell.removeStyleClass("green");
                            oCell.removeStyleClass("orange");
                            oCell.removeStyleClass("default");
                            if (sCProp.includes("SOF") == true && sCProp.includes("GMB") == true) {
                                oCell.addStyleClass("orange");
                            } else if (sCProp.includes("SOF") == true) {
                                oCell.addStyleClass("red");
                            } else if (sCProp.includes("GMB") == true) {
                                oCell.addStyleClass("green");
                            } else {
                                oCell.addStyleClass("default");
                            }
                        }
                    }
                });
                oRows = this.getView().byId('idMixAktOrderTable').getRows();
                $.each(oRows, function (i, e) {
                    //var oTable = that.getView().byId("idMixerOrderTable");
                    // Daten zur Tabellenzeile lesen
                    var oContext = oRows[i].getBindingContext();
                    for (var j = 0; j < oRows[i].getCells().length; j++) {
                        // Eine einzelne Zelle der Tabelle lesen
                        var oCell = oRows[i].getCells()[j];
                        // Nur Ändern, falls Daten zur Zeile vorhanden sind
                        if (oContext) {
                            // Name der Spalte dynamisch ermitteln
                            var sCProp = oContext.getProperty("C" + (j + 1) + "Prop");
                            // Zurücksetzen der CSS Formatierung
                            oCell.removeStyleClass("red");
                            oCell.removeStyleClass("green");
                            oCell.removeStyleClass("orange");
                            oCell.removeStyleClass("default");
                            if (sCProp.includes("SOF") == true && sCProp.includes("GMB") == true) {
                                oCell.addStyleClass("orange");
                            } else if (sCProp.includes("SOF") == true) {
                                oCell.addStyleClass("red");
                            } else if (sCProp.includes("GMB") == true) {
                                oCell.addStyleClass("green");
                            } else {
                                oCell.addStyleClass("default");
                            }
                        }
                    }
                });
            },

            onRenderComplete2: function (oEvent) {
                /*hole Vizframe, Feed, setze Name...*/
            },

            /*Datumskonvertierung von timestamp --> date (js)*/
            dateConversion(timestamp) {

                return new Date(timestamp).getHours() + ':' + new Date(timestamp).getMinutes();

            },

            _setTableColumnsVisible: function (numberOfVisibleColumns, table_id) {

                // Die Anzahl der Spalten der Tabelle beschränken 
                var aColumns = this.getView().byId(table_id).getColumns();
                for (var i = 0; i < aColumns.length; i++) {
                    if (i < numberOfVisibleColumns) { aColumns[i].setVisible(true); }
                    else { aColumns[i].setVisible(false); };
                }
            },
            onscroll: function (oEvent) {
                //var oRows = this.getView().byId('idMixerOrderTable').getRows();
            },
            onDataReceived: function (oEvent) {
                var oModel = this.getView().getModel();
                var that = this;

                var sPath = "/HeaderSet";
                var oFilter = [
                    new Filter("Werks", "EQ", "FRL")
                ];
                var titel_txt = "";
                var titel_txt_erl = "";
                var menge = 0.0;
                var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
                oModel.read(sPath, {
                    filters: oFilter,
                    success: function (oData, oResponse) {
                        // save variable
                        oData.results.forEach(function (result) {
                            if (result.Ident == "komp") {
                                titel_txt = titel_txt + oResourceBundle.getText("title");
                                menge = Math.round(result.Menge / 100) / 10;
                                titel_txt = titel_txt + " - Aufträge: " + result.AnzAuftr + " Menge: " + menge + " t || ";
                                var vizFrame = that.getView().byId("idVizFrame");
                                vizFrame.setVizProperties({
                                    title: { text: titel_txt }
                                });
                            }
                            if (result.Ident == "mxak") {
                                titel_txt = titel_txt + oResourceBundle.getText("title2");
                                menge = Math.round(result.Menge / 100) / 10;
                                titel_txt = titel_txt + " - Aufträge: " + result.AnzAuftr + " Menge: " + menge + " t";
                                var vizFrame2 = that.getView().byId("idVizFrame");
                                vizFrame2.setVizProperties({
                                    title: { text: titel_txt }
                                });
                            }
                            if (result.Ident == "erl") {
                                titel_txt_erl = oResourceBundle.getText("title3");
                                menge = Math.round(result.Menge / 100) / 10;
                                titel_txt_erl = titel_txt_erl + ": " + result.AnzAuftr + " Menge: " + menge + " t";
                                var vizFrame3 = that.getView().byId("idVizFrame3");
                                vizFrame3.setVizProperties({
                                    title: { text: titel_txt_erl }
                                });
                            }
                        });
                    }.bind(this),
                    error: function (oError) {
                        // show error
                    }
                });
                //return; // nun in onRenderComplete
            },
            _initWS: function () {
                var that = this;
                // open a WebSocket connection
                // window.location.host = WIBERGS4.adswiberg.lan.wiberg.at:8050
                //this._ws = new WebSocket("ws://WIBERGS4.adswiberg.lan.wiberg.at:8050/sap/bc/apc/sap/zwib_apc_prodstati");
                this._ws = new WebSocket("ws://" + window.location.host + "/sap/bc/apc/sap/zwib_apc_prodstati");
                this._ws.onopen = function () {
                    // WebSocket is connected, send data using send()
                    //that._ws.send("UI5: Sending Message ….");
                };

                this._ws.onmessage = function (msg) {
                    // process received Message
                    MessageToast.show("Refresh: " + msg.data);
                    if (msg.data.includes('PRODSTATI') == true) {
                        that.getView().getModel().refresh(true);
                        //Aktualisierung der Überschriften

                    }
                    // optionally close connection
                    //ws.close();
                };

                this._ws.onclose = function () {
                    // WebSocket is closed.
                    //alert("UI5: Connection is closed…");
                };
            } //,
            // Send Message
            //onPressSendMessage: function (oEvent) {
            //    this._ws.send("UI5: Press Send Message");
            //}
        })
    }
)