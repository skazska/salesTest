/**
 * Created by ska on 3/13/16.
 */
var fs = require('fs');
var index = require('./index.js');

fs.readFile('event.json',{},function(err, data){
  var context = {
    done: function(err, result){
      if (err) console.error(err);
      if (result) console.log(result);
    }
  };
  index.handler(JSON.parse(data), context);
});
