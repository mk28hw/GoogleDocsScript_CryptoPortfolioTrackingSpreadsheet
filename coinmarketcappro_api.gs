/*
* @author 
* Marotron
* @description 
* CoinMarketCap API v2 (Pro) wrapper (works with GAS)
* @version 0.2 
* Basic Account usage: maximum 1 request per 5 minutes 
https://pro-api.coinmarketcap.com/v1/
cryptocurrency/listings/latest?
CMC_PRO_API_KEY=/* here your api key */

&start=1
&limit=5000
&convert=USD

/cryptocurrency/*
/global-metrics/*
/tools/*

../latest
../historical
../info
../map
*/

function coinmarketcapproApi() { 

  /*
  * Gets Tickers of all coins from Coinmarketcap.
  * @return {Dictionary} Coins
  */
  this.getTickers = function () { 
    const coin_convertion = {
      "BCH":"BCC",
      "BCC":"BCH"
    };
    const LIMIT = 300; // Limit how many coins is on the query list
    var hash_table = {};
    var scriptProperties = PropertiesService.getScriptProperties();
    var counter = +scriptProperties.getProperty('counter');
    counter = counter > 5 ? 0 : counter + 1;
    scriptProperties.setProperty('counter', counter);
    //scriptProperties.setProperty('counter', counter);
    btc_usd_price_old = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ColdPortfolio").getRange("D5").getValue();
    usd_btc_price_old = 1 / btc_usd_price_old;
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ColdPortfolio").getRange("AR3").setValue(counter);
    /* data available:
    int start [1]
    int limit [100]
    string convert 
    string convert_id 
    string sort [market_cap]
    string sort_dir
    string cryptocurrency_type [all]
    */
    var data = '&limit=' + (counter ? LIMIT : 1200) + '&convert=USD';
    if (!counter) SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ColdPortfolio").getRange("AR3").setValue(getTimeStamp());
    //try {
    try { 
      var response = this.coinmarketcapRequest("cryptocurrency/listings/latest",data);
      if (response != null) { 
        Logger.log("Coinmarketcappro_api coinmarketcapRequest getTickers Success: ");
        Logger.log(response); 
      }
    } catch(err) {
      Logger.log("Coinmarketcappro_api coinmarketcapRequest getTickers Error");
    }
      if (response != null) { 
        response.forEach(function(result,index) {
          if (result.symbol == "BTC") {
            btc_usd_price = result.quote.USD.price;
            usd_btc_price = 1 / btc_usd_price;
            btc_usd_price_old = btc_usd_price;
            usd_btc_price_old = usd_btc_price;
          } else { 
            btc_usd_price = btc_usd_price_old;
            usd_btc_price = usd_btc_price_old;
          }
          hash_table[coin_convertion[result.symbol] ? coin_convertion[result.symbol] : result.name=="kingn-coin" ? "KNCN" : result.symbol ] = {
            'id'                : +result.id, 
            'currency'          : result.name, 
            'symbol'            : result.symbol, 
            'rank'              : +result.cmc_rank, 
            'USDT'              : {
              'market'            : 'USDT',
              'last'              : +result.quote.USD.price, 
              '24h_volume_usd'    : +result.quote.USD.volume_24h,
              'market_cap_usd'    : +result.quote.USD.market_cap,
              'percent_change_1h' : +result.quote.USD.percent_change_1h, 
              'percent_change_24h': +result.quote.USD.percent_change_24h, 
              'percent_change_7d' : +result.quote.USD.percent_change_7d, },  
            'BTC'               : {
              'market': 'BTC',
              'last': +result.quote.USD.price * usd_btc_price },
            'circulating_supply'  : +result.circulating_supply,
            'total_supply'      : +result.total_supply,
            'last_updated'      : +result.last_updated
          };
        });
      } // if end
    //} catch(err) {
      
   // }
    
    return hash_table;
  };
  
  
   /*
  * Gets Globals from Coinmarketcap.
  * @return {Dictionary} Globals
  */
  this.getGlobals = function () { 
    var result = this.coinmarketcapRequest("global-metrics/quotes/latest","");
    var hash_table = {
      'btc_dominance'                   : result.btc_dominance,
      'eth_dominance'                   : result.eth_dominance,
      'total_market_cap_usd'            : result.quote.USD.total_market_cap, 
      'total_24h_volume_usd'            : result.quote.USD.total_volume_24h, 
      'bitcoin_percentage_of_market_cap': result.quote.USD.bitcoin_percentage_of_market_cap, 
      'active_currencies'               : result.active_cryptocurrencies, 
      'active_exchanges'                : result.active_exchanges   
    };
    return hash_table;
  };
  

  /*
  * @param {String} query 
  * @return {Object} Response
  */
  this.coinmarketcapRequest = function (query, data){
    const API_KEY = /* here your api key */;
    var http_status = {
      200 : "Success",
      400 : "Bad Request",
      401 : "Unathorised",
      402 : "Payment Required",
      403 : "Forbidden",
      429 : "Too Many Requests",
      500 : "Internal Server Error"
    };
    var request_status;
    
    var request_data = UrlFetchApp.fetch("https://pro-api.coinmarketcap.com/v1/" + query + "?CMC_PRO_API_KEY=" + API_KEY + data, {'muteHttpExceptions': true});
    request_status = request_data.getResponseCode();
    if (request_status == 200) {
      errorSet(1, "Loading " + query + "...OK", false);
      Logger.log("Coinmarketcappro_api http request Success");
      return request_json = JSON.parse(request_data.getContentText()).data;  //JSON.parse(response.getContentText());  
    } else {
      errorSet(1, "Loading " + query + "...Error!!! " + http_status[request_status], true);
      Logger.log("Coinmarketcappro_api http request Error: " + http_status[request_status]);
      return null;
    }
  };
}
