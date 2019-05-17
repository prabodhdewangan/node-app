const elasticsearch = require('elasticsearch');
var request = require('sync-request');

exports.getData = function(restURL) {
	console.log("restURL :" +restURL);
	var res = request('GET', restURL);
	console.log("res.getBody() :" + res.getBody());
	var json = JSON.parse(res.getBody());
	return JSON.stringify(json, null, " ");
};

const client = new elasticsearch.Client({
    host: 'https://search-alagen-labs-es-demo-gwvhpmfya36soejrdqhjnycjwe.us-east-1.es.amazonaws.com',
    log: 'error'
 });

exports.uploadToES = function (indexName, esContent, start_utcseconds, end_utcseconds){
	client.indices.create({
	     index: indexName
	 }, function(err, resp, status) {
	     if (err) {
	         console.log(err);
	     } else {
	         console.log("create", resp);
	     }
	 });
	
	bulkIndex(indexName, 'doc', esContent, start_utcseconds, end_utcseconds)
}

exports.paserJSON = function (rawJSON){
  	
  jsonObj = JSON.parse(rawJSON)
	
  var newJSONObj = new Object();
  newJSONObj.start_utcseconds = jsonObj.data.start_utcseconds;
  newJSONObj.end_utcseconds = jsonObj.data.end_utcseconds;
  newJSONObj.threat_count_by_user=jsonObj.data.dashboard.threat_count_by_user;
  newJSONObj.message_count_by_threat_level=jsonObj.data.dashboard.message_count_by_threat_level;
  newJSONObj.threat_count_by_sender_domain=jsonObj.data.dashboard.threat_count_by_sender_domain;
  newJSONObj.reason_title_infos = new Array();
  for(let i = 0; i < jsonObj.data.dashboard.reason_title_infos.length; i++){

	   console.log(jsonObj.data.dashboard.reason_title_infos[i]);
	   for(let j = 0 ; j < jsonObj.data.dashboard.reason_title_infos[i].length; j++){
		   	var object = new Object();
		   	object.count = jsonObj.data.dashboard.reason_title_infos[i][j];
		   	object.type = jsonObj.data.dashboard.reason_title_infos[i][++j]; 
	   		newJSONObj.reason_title_infos.push(object)
	   }
	}
  console.log('Sanitized: ', newJSONObj)
  return newJSONObj;
}

const bulkIndex = function bulkIndex(index, type, data, start_utcseconds, end_utcseconds) {
    let bulkBody = [];
  
    data.forEach(item => {
      bulkBody.push({
        index: {
          _index: index,
          _type: type,
        }
      });
      item.metricStartTime= start_utcseconds;
      item.metricEndTime= end_utcseconds;
  
      bulkBody.push(item);
    });
  
client.bulk({body: bulkBody})
    .then(response => {
      let errorCount = 0;
      response.items.forEach(item => {
        if (item.index && item.index.error) {
          console.log(++errorCount, item.index.error);
        }
      });
      console.log(
        `Successfully indexed ${data.length - errorCount}
         out of ${data.length} items`
      );
    })
    .catch(console.err);
};
