'use strict'

//plugin
var plugin = function(options) 
{
    var seneca = this;

    seneca.add("area:patient, action:fetch",function(args, done){
        console.log("-->fetch all");
        var patient = this.make("patient");
        patient.list$({}, done);
    });

    seneca.add("area:patient, action:add", function(msg, done){
        console.log("-->add, patient_name:"+ msg.args.query.patient_name);

        var patient = this.make("patient")
        patient.patient_name = msg.args.query.patient_name;
        patient.patient_phone = msg.args.query.patient_phone;
        patient.patient_address = msg.args.query.patient_address;
        patient.patient_age = msg.args.query.patient_age;
        patient.patient_gender = msg.args.query.patient_gender;
        patient.patient_medicalrecord = msg.args.query.patient_medicalrecord;

        patient.save$(function(err, patient) {
            done(err, patient.data$(false));
        })
    });

    seneca.add("area:patient, action:fetchbyid", function(msg, done){
        console.log("-->fetchbyid, patient_id:"+ msg.args.params.patient_id);
        var patient = this.make("patient");
        patient.load$({id:msg.args.params.patient_id}, done)
    });
    
    seneca.add("area:patient, action: delete", function(msg, done){
        var patient = this.make("patient");
        patient.remove$({id:msg.args.params.patient_id}, function(err){
            done(err, null)
        })
    });

    seneca.add("area: patient, action: edit", function(msg, done)
    {
        console.log("-->edit, patient_id:"+ msg.args.params.patient_id);

        var patient = this.make("patient");
        patient.list$({id: msg.args.params.patient_id}, function(err, result){          
            var pa = result[0];

            console.log("-->edit, before editing, the query: ");
            console.log("%j", msg.args.query);
    
            console.log("-->edit, before editing, patient: " + pa);
            pa.data$(
                {
                patient_name: msg.args.query.patient_name,
                patient_phone: msg.args.query.patient_phone,
                patient_address: msg.args.query.patient_address,
                patient_age: msg.args.query.patient_age,
                patient_gender: msg.args.query.patient_gender,            
                patient_medicalrecord: msg.args.body.patient_medicalrecord
                }
            );
            console.log("prior to save$, pa: " + pa);

            pa.save$(function(err, pa){
                done(err, pa.data$(false))
            })
        })
    }); 
}
//export plugin
module.exports = plugin;

//initialize seneca
var seneca = require('seneca')()

//initialize entity for data management
const entities = require('seneca-entity');

//use integration between entity and MongoDb
const mongo_store = require('seneca-mongo-store');

//expose plugin that handles REST API
const web = require("seneca-web");

//Initialize express
var express = require('express');

//get access to our application on access
var app = express();

//integrate binding between express and seneca. Configuration json
var config = {
    //define the routes
    //mapping for the routes
    routes:{
        prefix : '/patient',
        pin: "area:patient,action:*",
        map:{
            fetch: {GET: true},
            add: {POST: true},
            fetchbyid: {GET: true, suffix: '/:patient_id'},
            delete : {DELETE: true, suffix: '/:patient_id'},
            edit: {PUT: true, suffix: '/:patient_id'}
        }
    },

    //define the adapter.
    //integrate seneca wih the adapter
    //defined in the configuration
    adapter: require('seneca-web-adapter-express'),

    //to have a control on body parsing seperate from seneca
    //independent parsing through the express framework
    //web adpater wont be parsing the body, instead is express is parsing th body. Set as false
    options: {parseBody: false},
    context: app

};

//additional express middleware to parse json formated using
app.use(require("body-parser").json());

//initializa seneca
//loading plugins 
seneca
.use(entities)
.use(plugin)
//enabling my web
.use(web,config)
//enabling my mongoDb
.use(mongo_store, {
    name:"seneca",
    host:"127.0.0.1",port:"27017"
    // uri: 'mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.6.0'
})
//ready functiom
.ready(() => {
    //starting web pluign
    var server = seneca.export('web/context')()
    server.listen('3000', () => {
        console.log('server started on: 3000')
    })
    console.log("Server listening on: //localhost:"+3000);
    console.log("--- Actions -----------");
    console.log("https://localhost:3000/patient/fetch");
    console.log("https://localhost:3000/patient/fetchbyid/123");
    console.log("https://localhost:3000/patient/add");
    console.log("https://localhost:3000/patient/delete");
    console.log("https://localhost:3000/patient/edit/123");
})

