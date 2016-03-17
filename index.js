/**
 * Created by ska on 3/13/16.
 */

var jsforce = require('jsforce');
var async = require('async');
var fs = require('fs');
var unzip = require('unzip');
var packer = require('zip-stream');



module.exports.handler = function( event, context) {

  var conn = new jsforce.Connection({
    loginUrl : event.host || 'https://eu6.salesforce.com'
  });

  conn.login(event.username, event.password, function(err, userInfo) {
    if (err) { return context.done(err); }

    async.parallel(
      [
        function validationRules(vrcb){
          conn.metadata.read('CustomObject', [event.objectName], function(err, metadata) {
            if (err) return vrcb(err);
            var ruleNames = [];
            metadata.validationRules.forEach(function(rule){
              if (rule.active === true || rule.active === 'true'){
                rule.active = false;
                ruleNames.push(rule.fullName);
              }
            });
            conn.metadata.update('CustomObject', metadata, function(err, result) {
              if (err) return vrcb(err);
              ruleNames.forEach(function(fullName){
                console.log('validation rule ' + fullName + ' deactivation ' + (result.success ? 'successful' : 'failed'));
              });

              vrcb();

            });
          });
        },
        function workFlowRules(wfrcb) {
          conn.metadata.read('Workflow', [event.objectName], function(err, metadata) {
            if (err) return wfrcb(err);
            var ruleNames = [];
            metadata.rules.forEach(function(rule){
              if (rule.active === true || rule.active === 'true'){
                rule.active = false;
                ruleNames.push(rule.fullName);
              }
            });
            conn.metadata.update('Workflow', metadata, function(err, result) {
              if (err) return wfrcb(err);
              ruleNames.forEach(function(fullName){
                console.log('workflow rule ' + fullName + ' deactivated ' + (result.success ? 'successfully' : 'failed'));
              });

              wfrcb();

            });
          });
        },
        function apexTrigger(atcb){
          conn.metadata.list([{type:'ApexTrigger'}], function(err, metadata) {
            if (err) return atcb(err);

            async.each(metadata, function(metadata, mdcb){

              conn.tooling.sobject('ApexTrigger')
                .find({ Id: metadata.id })
                .execute(function(err, records) {
                  if (err) return mdcb(err);
                  async.each(records, processTrigger, mdcb);
                });
            }, function(err){
              atcb(err);
            });
          });
        }
      ],
      context.done
    );

    function processTrigger(record, callback){
      if (record.Status !== 'Active') return callback();


      var pendingEntries = 1;
      var archive = new packer();

      conn.metadata.deploy(archive, {})
        .complete(function(err, result) {
          if (err) return callback(err);
          console.log('trigger ' + record.Name + ' deactivation ' + result.status);
          callback();
        });

      function archiveFinish(){
        if (--pendingEntries == 0) {
          archive.finish();
        }
      }

      conn.metadata
        .retrieve({unpackaged:{ types: [{ name: 'ApexTrigger', members: record.Name}]}})
        .stream()
        .pipe(unzip.Parse())
        .on('close', function () {
          archiveFinish();
        })
        .on('error', function (arg) {
          callback(arg);
        })
        .on('entry', function (entry) {
          pendingEntries++;
          var fileName = entry.path;
          if (fileName.indexOf(record.Name+".trigger-meta.xml") >= 0) {
            var data = '';
            entry.on('data', function(chunk){ data += chunk; });
            entry.on('end', function(){
              data = data.replace('<active>true</active>', '<active>false</active>');
              archive.entry(data, {name: fileName}, function(err, newEntry){
                archiveFinish();
              });
            })
          } else {
            archive.entry(entry, {name: fileName}, function(err, newEntry){
              archiveFinish();
            });

          }
        })
      ;

    }

  });

};