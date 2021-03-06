const express = require('express')
const multer  =   require('multer');
const router = express.Router()
const { check, validationResult } = require('express-validator/check')
const { matchedData } = require('express-validator/filter')
const fs = require('fs');
const utils = require('./utils');
const moment = require('moment');
const csv = require('csvtojson');

exports.util = utils

router.get('/', (req, res) => {
  res.render('index', {
	  csrfToken: req.csrfToken(),
	  status : '',
	  filename : ''
	  
  })
})

router.get('/contact', (req, res) => {
  res.render('contact', {
    data: {},
    errors: [],
    errorMap: {},
    csrfToken: req.csrfToken()
  })
})

router.post('/contact', [
  check('message').isLength({ min: 1 }).withMessage('Message is required').trim(),
  check('email').isEmail().withMessage('That email doesn‘t look right').trim().normalizeEmail(),
  check('link').isLength({ min: 10 }).isURL().withMessage('Invalid URL').trim()
], (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.render('contact', {
      data: req.body,
      errors: errors.array(),
      errorMap: errors.mapped(),
      csrfToken: req.csrfToken()
    })
  }

  const data = matchedData(req)
  console.log('Sanitized: ', data)
  // Homework: send sanitized data in an email or persist in a db

  req.flash('success', 'Thanks for the message! I‘ll be in touch :)')
  console.log("request :" + data.link)
  res.redirect('/')
})

router.get('/rest', (req, res) => {
  res.render('rest', {
    data: {},
    errors: [],
    response: '',
    errorMap: {},
    csrfToken: req.csrfToken()
  })
})

router.post('/rest', [
  check('link').isLength({ min: 10 }).isURL().withMessage('Invalid URL').trim()
], (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.render('rest', {
      data: req.body,
      errors: errors.array(),
      errorMap: errors.mapped(),
      csrfToken: req.csrfToken()
    })
  }
  const data = matchedData(req)
  var response = '';
  res.render('rest.ejs', { response:  utils.getData(data.link) , csrfToken: req.csrfToken(), data: data, errors: [], errorMap: {}});
  console.log("request :" + data.link)
})


var upload = multer({ dest: '/tmp/' })
router.post('/upload', upload.single('userFile'), function (req, res, next) {
	console.log('Uploading file...' + req.file.mimetype + " : "+ req.file.detectedMimeType);
	if (req.file) {
        console.log('Uploading file...' + req.file.mimetype);
        var filename = req.file.originalname;
        var uploadStatus = 'File Uploaded Successfully';
    } else {
        console.log('No File Uploaded');
        var filename = 'FILE NOT UPLOADED';
        var uploadStatus = 'File Upload Failed';
    }
	var isCSV = false;
	switch (req.file.mimetype) { 
	  case 'text/csv':
		    isCSV = true;
	    	break
	  case 'application/json':
	    break
	  default:
	    return next(new Error('Unspported file type'))
	}
	
	    
    /* ===== Add the function to save filename to database ===== */
    console.log(req.file.destination + req.file.filename);
    
  	if (!isCSV){
  		var rawdata = fs.readFileSync(req.file.destination + req.file.filename);
	  	let newJSONObj = utils.paserJSON(rawdata);  
	  	console.log('Sanitized: end_utcseconds=', newJSONObj.end_utcseconds)
	    console.log('Sanitized: start_utcseconds= ', newJSONObj.start_utcseconds) 
	    
	    console.log('Sanitized: end_utcseconds=', moment.unix(newJSONObj.end_utcseconds).format("MM/DD/YYYY"))
	    console.log('Sanitized: start_utcseconds= ', moment.unix(newJSONObj.start_utcseconds).format("MM/DD/YYYY")) 
	    var indexSuffix = moment.unix(newJSONObj.start_utcseconds).format("YYYY.MM.DD")
	    console.log("threat_count_by_user-"+indexSuffix);
	  	
	  	utils.uploadToES("reason_title_infos-"+indexSuffix , newJSONObj.reason_title_infos, newJSONObj.start_utcseconds, newJSONObj.end_utcseconds);
	  	
	    utils.uploadToES("threat_count_by_user-"+indexSuffix , newJSONObj.threat_count_by_user, newJSONObj.start_utcseconds, newJSONObj.end_utcseconds);
	    
	    utils.uploadToES("message_count_by_threat_level-"+indexSuffix , newJSONObj.message_count_by_threat_level, newJSONObj.start_utcseconds, newJSONObj.end_utcseconds);
	    
	    utils.uploadToES("threat_count_by_sender_domain-"+indexSuffix , newJSONObj.threat_count_by_sender_domain, newJSONObj.start_utcseconds, newJSONObj.end_utcseconds);
  	} 
  	else {
  		console.log("Reading file from :" + req.file.destination + req.file.filename);
  		
  		csv({flatKeys:true})
  		.fromFile(req.file.destination + req.file.filename)
  		.preFileLine((csvRawData, lineIdx)=>{
  			if (csvRawData.charAt(0) == "\""){
		 		csvRawData = csvRawData.substring(1, csvRawData.length);
		 	}
		 	var length = csvRawData.length;
		 	if (csvRawData.charAt(length-1) == "\""){
		 		csvRawData = csvRawData.substring(0, csvRawData.length-1);
		 	}
		 	csvRawData = csvRawData.replace(/""/g, '"'); //some fields have double double quotes
	 		return csvRawData;
  		})
  		.then((jsonObj)=>{
  			console.log(jsonObj);
  			
  			var indexSuffix = moment().format("YYYY.MM.DD")
  		    console.log('Sanitized: start_utcseconds= ', indexSuffix) 
  		    utils.uploadToES("csv-"+ indexSuffix , jsonObj, moment().unix(), moment().unix());
  		})
  	}
    res.render('index.ejs', { csrfToken: req.csrfToken(), status: uploadStatus, filename: `Name Of File: ${filename}` });
})

router.get('/json', (req, res) => {
  res.render('json', {
    data: {},
    errors: [],
    errorMap: {},
    csrfToken: req.csrfToken()
  })
})

router.post('/json', [
  check('message')
    .isLength({ min: 1 })
    .withMessage('Message is required')
    .trim()   
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
	    return res.render('json', {
	      data: req.body,
	      errors: errors.array(),
	      errorMap: errors.mapped(),
	      csrfToken: req.csrfToken()
	    })
	  }
  // console.log("msg :"+ req.body.message)
  var json = JSON.parse(req.body.message);
// var myEscapedJSONString = json.replace(/\\n/g, "\\n")
// .replace(/\\'/g, "\\'")
// .replace(/\\"/g, '\\"')
// .replace(/\\&/g, "\\&")
// .replace(/\\r/g, "\\r")
// .replace(/\\t/g, "\\t")
// .replace(/\\b/g, "\\b")
// .replace(/\\f/g, "\\f");
// console.log("myEscapedJSONString :"+ myEscapedJSONString)
  
  jsonObj = JSON.stringify(json);
  
  console.log("jsonObj :"+ json)
  console.log("jsonObj.data :"+ json.data)
  
  var newJSONObj = new Object();
  newJSONObj.threat_count_by_user=json.data.dashboard.threat_count_by_user;
  newJSONObj.message_count_by_threat_level=json.data.dashboard.message_count_by_threat_level;
  newJSONObj.threat_count_by_sender_domain=json.data.dashboard.threat_count_by_sender_domain;
  newJSONObj.reason_title_infos=json.data.dashboard.reason_title_infos;
  
  const data = matchedData(req)
  console.log('Sanitized: end_utcseconds=', newJSONObj.end_utcseconds)
  console.log('Sanitized: start_utcseconds= ', newJSONObj.start_utcseconds)
  
  // Homework: send sanitized data in an email or persist in a db

  res.write(JSON.stringify(newJSONObj));
})

module.exports = router