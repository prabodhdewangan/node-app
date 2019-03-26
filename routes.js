const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator/check')
const { matchedData } = require('express-validator/filter')

router.get('/', (req, res) => {
  res.render('index')
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
  check('message')
    .isLength({ min: 1 })
    .withMessage('Message is required')
    .trim(),
  check('email')
    .isEmail()
    .withMessage('That email doesn‘t look right')
    .trim()
    .normalizeEmail(),
  check('link')
  	.isLength({ min: 10 })
  	.isURL()
  	.withMessage('Invalid URL')
  	.trim()
    
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
  res.redirect('/')
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
  console.log('Sanitized: ', newJSONObj)
  // Homework: send sanitized data in an email or persist in a db

  res.write(JSON.stringify(newJSONObj));
})

module.exports = router